import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { folders, projects, visualizations } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

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
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.parentId !== undefined) updateData.parentId = body.parentId;

    const [updated] = await db
      .update(folders)
      .set(updateData)
      .where(and(eq(folders.id, id), isNull(folders.deletedAt)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update folder:', error);
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}

// Recursively soft-delete a folder and all its contents
async function softDeleteFolderRecursive(folderId: number, now: Date) {
  // Soft-delete the folder itself
  await db
    .update(folders)
    .set({ deletedAt: now })
    .where(and(eq(folders.id, folderId), isNull(folders.deletedAt)));

  // Soft-delete all projects in this folder
  const deletedProjects = await db
    .update(projects)
    .set({ deletedAt: now })
    .where(and(eq(projects.folderId, folderId), isNull(projects.deletedAt)))
    .returning();

  // Soft-delete all visualizations belonging to those projects
  for (const proj of deletedProjects) {
    await db
      .update(visualizations)
      .set({ deletedAt: now })
      .where(and(eq(visualizations.projectId, proj.id), isNull(visualizations.deletedAt)));
  }

  // Recurse into child folders
  const childFolders = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.parentId, folderId), isNull(folders.deletedAt)));

  for (const child of childFolders) {
    await softDeleteFolderRecursive(child.id, now);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Check the folder exists and is not already deleted
    const [folder] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, id), isNull(folders.deletedAt)));

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const now = new Date();
    await softDeleteFolderRecursive(id, now);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete folder:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
