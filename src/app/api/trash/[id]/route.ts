import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualizations, projects, folders } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId(request);
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { type } = body;

    if (type === 'visualization') {
      const [restored] = await db
        .update(visualizations)
        .set({ deletedAt: null })
        .where(and(eq(visualizations.id, id), isNotNull(visualizations.deletedAt), eq(visualizations.userId, userId)))
        .returning();

      if (!restored) {
        return NextResponse.json({ error: 'Item not found in trash' }, { status: 404 });
      }

      await db
        .update(projects)
        .set({ deletedAt: null })
        .where(eq(projects.id, restored.projectId));

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
        .where(and(eq(folders.id, id), isNotNull(folders.deletedAt), eq(folders.userId, userId)))
        .returning();

      if (!restored) {
        return NextResponse.json({ error: 'Folder not found in trash' }, { status: 404 });
      }

      const restoredProjects = await db
        .update(projects)
        .set({ deletedAt: null })
        .where(and(eq(projects.folderId, id), eq(projects.userId, userId)))
        .returning();

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId(request);
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'visualization') {
      const [deleted] = await db
        .delete(visualizations)
        .where(and(eq(visualizations.id, id), isNotNull(visualizations.deletedAt), eq(visualizations.userId, userId)))
        .returning();

      if (!deleted) {
        return NextResponse.json({ error: 'Item not found in trash' }, { status: 404 });
      }

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
      // Verify folder belongs to user
      const [folder] = await db
        .select()
        .from(folders)
        .where(and(eq(folders.id, id), eq(folders.userId, userId)));
      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
      }

      const folderProjects = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.folderId, id), eq(projects.userId, userId)));

      for (const proj of folderProjects) {
        await db.delete(visualizations).where(eq(visualizations.projectId, proj.id));
        await db.delete(projects).where(eq(projects.id, proj.id));
      }

      const childFolders = await db
        .select({ id: folders.id })
        .from(folders)
        .where(and(eq(folders.parentId, id), eq(folders.userId, userId)));

      for (const child of childFolders) {
        const childProjects = await db
          .select({ id: projects.id })
          .from(projects)
          .where(and(eq(projects.folderId, child.id), eq(projects.userId, userId)));
        for (const cp of childProjects) {
          await db.delete(visualizations).where(eq(visualizations.projectId, cp.id));
          await db.delete(projects).where(eq(projects.id, cp.id));
        }
        await db.delete(folders).where(eq(folders.id, child.id));
      }

      await db.delete(folders).where(eq(folders.id, id));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type. Must be "visualization" or "folder".' }, { status: 400 });
  } catch (error) {
    console.error('Failed to permanently delete:', error);
    return NextResponse.json({ error: 'Failed to permanently delete' }, { status: 500 });
  }
}
