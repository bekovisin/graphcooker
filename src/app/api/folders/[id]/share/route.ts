import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { folders, projects, visualizations, users } from '@/lib/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
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

    const allVisualizations = await db
      .select()
      .from(visualizations)
      .where(and(eq(visualizations.userId, userId), isNull(visualizations.deletedAt)));

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
          })
          .returning({ id: folders.id });

        oldToNewFolderId.set(srcFolderId, newFolder.id);
      }

      // ── Layer 2: Copy projects ──
      const projectsInFolders = allProjects.filter(
        (p) => p.folderId !== null && folderIdsToCopy.includes(p.folderId)
      );

      const oldToNewProjectId = new Map<number, number>();

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

      // ── Layer 3: Copy visualizations ──
      const vizProjectIds = projectsInFolders.map((p) => p.id);
      const vizsInProjects = allVisualizations.filter(
        (v) => vizProjectIds.includes(v.projectId)
      );

      for (const srcViz of vizsInProjects) {
        const newProjectId = oldToNewProjectId.get(srcViz.projectId);
        if (!newProjectId) continue;

        await db.insert(visualizations).values({
          projectId: newProjectId,
          name: srcViz.name,
          chartType: srcViz.chartType,
          data: srcViz.data,
          settings: srcViz.settings,
          columnMapping: srcViz.columnMapping,
          thumbnail: srcViz.thumbnail,
          userId: targetUser.id,
        });
      }

      // Send notification email (fire and forget)
      const totalItems = folderIdsToCopy.length + vizsInProjects.length;
      sendShareNotification(
        targetUser.email,
        targetUser.name,
        sender?.name || 'A user',
        'items',
        totalItems
      ).catch(() => {});
    }

    return NextResponse.json({ shared: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
