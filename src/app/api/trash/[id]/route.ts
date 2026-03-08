import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualizations, projects, folders } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

// PUT: Restore a specific item from trash
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { type } = body; // 'visualization' or 'folder'

    if (type === 'visualization') {
      const [restored] = await db
        .update(visualizations)
        .set({ deletedAt: null })
        .where(and(eq(visualizations.id, id), isNotNull(visualizations.deletedAt)))
        .returning();

      if (!restored) {
        return NextResponse.json({ error: 'Item not found in trash' }, { status: 404 });
      }

      // Also restore the associated project
      await db
        .update(projects)
        .set({ deletedAt: null })
        .where(eq(projects.id, restored.projectId));

      // If the project was in a folder, check if the folder is also deleted
      // If so, restore the folder as well so the item doesn't disappear
      const [project] = await db
        .select({ folderId: projects.folderId })
        .from(projects)
        .where(eq(projects.id, restored.projectId));

      if (project?.folderId) {
        await db
          .update(folders)
          .set({ deletedAt: null })
          .where(and(eq(folders.id, project.folderId), isNotNull(folders.deletedAt)));
      }

      return NextResponse.json({ success: true, restored });
    }

    if (type === 'folder') {
      const [restored] = await db
        .update(folders)
        .set({ deletedAt: null })
        .where(and(eq(folders.id, id), isNotNull(folders.deletedAt)))
        .returning();

      if (!restored) {
        return NextResponse.json({ error: 'Folder not found in trash' }, { status: 404 });
      }

      // Restore all projects within the folder
      const restoredProjects = await db
        .update(projects)
        .set({ deletedAt: null })
        .where(eq(projects.folderId, id))
        .returning();

      // Restore all visualizations belonging to those projects
      for (const proj of restoredProjects) {
        await db
          .update(visualizations)
          .set({ deletedAt: null })
          .where(eq(visualizations.projectId, proj.id));
      }

      return NextResponse.json({ success: true, restored });
    }

    return NextResponse.json({ error: 'Invalid type. Must be "visualization" or "folder".' }, { status: 400 });
  } catch (error) {
    console.error('Failed to restore item:', error);
    return NextResponse.json({ error: 'Failed to restore' }, { status: 500 });
  }
}

// DELETE: Permanently delete a specific item from trash
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'visualization') {
      const [deleted] = await db
        .delete(visualizations)
        .where(and(eq(visualizations.id, id), isNotNull(visualizations.deletedAt)))
        .returning();

      if (!deleted) {
        return NextResponse.json({ error: 'Item not found in trash' }, { status: 404 });
      }

      // Clean up orphaned project
      const remaining = await db
        .select({ id: visualizations.id })
        .from(visualizations)
        .where(eq(visualizations.projectId, deleted.projectId))
        .limit(1);
      if (remaining.length === 0) {
        await db.delete(projects).where(eq(projects.id, deleted.projectId));
      }

      return NextResponse.json({ success: true });
    }

    if (type === 'folder') {
      // Permanently delete all contents within the folder
      const folderProjects = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.folderId, id));

      for (const proj of folderProjects) {
        await db.delete(visualizations).where(eq(visualizations.projectId, proj.id));
        await db.delete(projects).where(eq(projects.id, proj.id));
      }

      // Delete child folders recursively
      const childFolders = await db
        .select({ id: folders.id })
        .from(folders)
        .where(eq(folders.parentId, id));

      for (const child of childFolders) {
        const childProjects = await db
          .select({ id: projects.id })
          .from(projects)
          .where(eq(projects.folderId, child.id));
        for (const cp of childProjects) {
          await db.delete(visualizations).where(eq(visualizations.projectId, cp.id));
          await db.delete(projects).where(eq(projects.id, cp.id));
        }
        await db.delete(folders).where(eq(folders.id, child.id));
      }

      // Finally delete the folder itself
      await db.delete(folders).where(eq(folders.id, id));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type. Must be "visualization" or "folder".' }, { status: 400 });
  } catch (error) {
    console.error('Failed to permanently delete:', error);
    return NextResponse.json({ error: 'Failed to permanently delete' }, { status: 500 });
  }
}
