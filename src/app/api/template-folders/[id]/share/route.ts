import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templates, templateFolders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserId, getUserRole } from '@/lib/auth/helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    const role = getUserRole(request);

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const folderId = parseInt(id);
    if (isNaN(folderId)) {
      return NextResponse.json({ error: 'Invalid folder ID' }, { status: 400 });
    }

    const body = await request.json();
    const { userIds } = body as { userIds: number[] };

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required' }, { status: 400 });
    }

    // Verify the folder exists and belongs to the admin
    const [rootFolder] = await db
      .select()
      .from(templateFolders)
      .where(eq(templateFolders.id, folderId));

    if (!rootFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }
    if (rootFolder.userId !== userId) {
      return NextResponse.json({ error: 'You can only share your own folders' }, { status: 403 });
    }

    // Fetch all user's template folders and templates for deep copy
    const allFolders = await db
      .select()
      .from(templateFolders)
      .where(eq(templateFolders.userId, userId));

    const allTemplates = await db
      .select()
      .from(templates)
      .where(eq(templates.userId, userId));

    // Build descendant tree from the root folder
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

    let totalCopied = 0;

    for (const targetUserId of userIds) {
      if (targetUserId === userId) continue;

      // Map old folder IDs to new folder IDs
      const oldToNewFolderId = new Map<number, number>();

      // Create folder copies in topological order (parents before children)
      for (const srcFolderId of folderIdsToCopy) {
        const srcFolder = foldersMap.get(srcFolderId);
        if (!srcFolder) continue;

        // Determine the new parentId
        let newParentId: number | null = null;
        if (srcFolderId === folderId) {
          // Root folder being shared — place at root level for target user
          newParentId = null;
        } else if (srcFolder.parentId !== null) {
          newParentId = oldToNewFolderId.get(srcFolder.parentId) ?? null;
        }

        const [newFolder] = await db
          .insert(templateFolders)
          .values({
            userId: targetUserId,
            name: srcFolder.name,
            parentId: newParentId,
          })
          .returning({ id: templateFolders.id });

        oldToNewFolderId.set(srcFolderId, newFolder.id);
      }

      // Copy all templates in these folders
      const templatesInFolders = allTemplates.filter(
        (t) => t.folderId !== null && folderIdsToCopy.includes(t.folderId)
      );

      for (const tpl of templatesInFolders) {
        const newFolderId = tpl.folderId !== null ? oldToNewFolderId.get(tpl.folderId) ?? null : null;
        await db.insert(templates).values({
          templateName: tpl.templateName,
          chartType: tpl.chartType,
          settings: tpl.settings,
          data: tpl.data,
          columnMapping: tpl.columnMapping,
          thumbnail: tpl.thumbnail,
          userId: targetUserId,
          folderId: newFolderId,
        });
      }

      totalCopied++;
    }

    return NextResponse.json({ copied: totalCopied, folders: folderIdsToCopy.length });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
