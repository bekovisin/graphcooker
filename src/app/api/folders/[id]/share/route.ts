import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { folders, projects, users } from '@/lib/db/schema';
import { eq, and, isNull, inArray, sql } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';
import { sendShareNotification } from '@/lib/email/send';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);

    const { id } = await params;
    const folderId = parseInt(id);
    if (isNaN(folderId)) {
      return NextResponse.json({ error: 'Invalid folder ID' }, { status: 400 });
    }

    const body = await request.json();
    const { userIds, emails } = body as { userIds?: number[]; emails?: string[] };

    // Resolve target user IDs
    let targetUserIds: number[] = [];

    if (Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds;
    } else if (Array.isArray(emails) && emails.length > 0) {
      const foundUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.email, emails));
      targetUserIds = foundUsers.map((u) => u.id);
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ shared: true });
    }

    // Verify root folder exists and belongs to user
    const [rootFolder] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, folderId), isNull(folders.deletedAt)));

    if (!rootFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }
    if (rootFolder.userId !== userId) {
      return NextResponse.json({ error: 'You can only share your own folders' }, { status: 403 });
    }

    // Fetch all user's folders, projects, and visualizations (non-deleted)
    const allFolders = await db
      .select()
      .from(folders)
      .where(and(eq(folders.userId, userId), isNull(folders.deletedAt)));

    const allProjects = await db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)));

    // Build descendant folder IDs
    const collectDescendantFolderIds = (parentId: number): number[] => {
      const children = allFolders.filter((f) => f.parentId === parentId);
      const ids: number[] = [];
      for (const child of children) {
        ids.push(child.id);
        ids.push(...collectDescendantFolderIds(child.id));
      }
      return ids;
    };

    const folderIdsToCopy = [folderId, ...collectDescendantFolderIds(folderId)];
    const foldersMap = new Map(allFolders.map((f) => [f.id, f]));

    // Get sender info
    const [sender] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId));

    // Get target user details
    const targetUsers = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(inArray(users.id, targetUserIds));

    for (const targetUser of targetUsers) {
      if (targetUser.id === userId) continue;

      // ── Layer 1: Copy folders ──
      const oldToNewFolderId = new Map<number, number>();

      for (const srcFolderId of folderIdsToCopy) {
        const srcFolder = foldersMap.get(srcFolderId);
        if (!srcFolder) continue;

        let newParentId: number | null = null;
        if (srcFolderId === folderId) {
          newParentId = null; // root level for target user
        } else if (srcFolder.parentId !== null) {
          newParentId = oldToNewFolderId.get(srcFolder.parentId) ?? null;
        }

        const [newFolder] = await db
          .insert(folders)
          .values({
            userId: targetUser.id,
            name: srcFolder.name,
            parentId: newParentId,
            sharedByUserId: userId,
          })
          .returning({ id: folders.id });

        oldToNewFolderId.set(srcFolderId, newFolder.id);
      }

      // ── Layer 2: Copy projects ──
      const projectsInFolders = allProjects.filter(
        (p) => p.folderId !== null && folderIdsToCopy.includes(p.folderId)
      );

      const oldToNewProjectId = new Map<number, number>();

      // Batch insert projects (need IDs back for viz mapping)
      for (const srcProject of projectsInFolders) {
        const newFolderId = srcProject.folderId !== null
          ? oldToNewFolderId.get(srcProject.folderId) ?? null
          : null;

        const [newProject] = await db
          .insert(projects)
          .values({
            userId: targetUser.id,
            name: srcProject.name,
            folderId: newFolderId,
          })
          .returning({ id: projects.id });

        oldToNewProjectId.set(srcProject.id, newProject.id);
      }

      // ── Layer 3: Copy visualizations via INSERT...SELECT (data stays in DB, no app transfer) ──
      let vizCopyCount = 0;
      const vizCopyPromises = projectsInFolders.map((srcProject) => {
        const newProjectId = oldToNewProjectId.get(srcProject.id);
        if (!newProjectId) return Promise.resolve(0);

        return db.execute(sql`
          INSERT INTO visualizations (project_id, name, chart_type, data, settings, column_mapping, thumbnail, user_id, shared_by_user_id)
          SELECT ${newProjectId}, name, chart_type, data, settings, column_mapping, thumbnail, ${targetUser.id}, ${userId}
          FROM visualizations
          WHERE project_id = ${srcProject.id} AND user_id = ${userId} AND deleted_at IS NULL
        `).then((r) => Number(r.rowCount ?? 0));
      });

      const vizCounts = await Promise.all(vizCopyPromises);
      vizCopyCount = vizCounts.reduce((a, b) => a + b, 0);

      // Send notification email (fire and forget)
      const totalItems = folderIdsToCopy.length + vizCopyCount;
      sendShareNotification(
        targetUser.email,
        targetUser.name,
        sender?.name || 'A user',
        'items',
        totalItems
      ).catch(() => {});
    }

    return NextResponse.json({ shared: true });
  } catch (error) {
    console.error('Folder share error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Share failed' },
      { status: 500 }
    );
  }
}
