import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { folders, projects, visualizations } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
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
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.parentId !== undefined) updateData.parentId = body.parentId;
    if (body.bgColor !== undefined) updateData.bgColor = body.bgColor;
    if (body.textColor !== undefined) updateData.textColor = body.textColor;
    if (body.iconColor !== undefined) updateData.iconColor = body.iconColor;

    const [updated] = await db
      .update(folders)
      .set(updateData)
      .where(and(eq(folders.id, id), isNull(folders.deletedAt), eq(folders.userId, userId)))
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

async function softDeleteFolderRecursive(folderId: number, userId: number, now: Date) {
  await db
    .update(folders)
    .set({ deletedAt: now })
    .where(and(eq(folders.id, folderId), isNull(folders.deletedAt), eq(folders.userId, userId)));

  const deletedProjects = await db
    .update(projects)
    .set({ deletedAt: now })
    .where(and(eq(projects.folderId, folderId), isNull(projects.deletedAt), eq(projects.userId, userId)))
    .returning();

  for (const proj of deletedProjects) {
    await db
      .update(visualizations)
      .set({ deletedAt: now })
      .where(and(eq(visualizations.projectId, proj.id), isNull(visualizations.deletedAt)));
  }

  const childFolders = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.parentId, folderId), isNull(folders.deletedAt), eq(folders.userId, userId)));

  for (const child of childFolders) {
    await softDeleteFolderRecursive(child.id, userId, now);
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

    const [folder] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, id), isNull(folders.deletedAt), eq(folders.userId, userId)));

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const now = new Date();
    await softDeleteFolderRecursive(id, userId, now);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete folder:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
