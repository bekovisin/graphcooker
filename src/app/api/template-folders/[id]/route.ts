import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templateFolders } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    const { id } = await params;
    const folderId = parseInt(id);
    if (isNaN(folderId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.parentId !== undefined) updates.parentId = body.parentId;
    if (body.bgColor !== undefined) updates.bgColor = body.bgColor;
    if (body.textColor !== undefined) updates.textColor = body.textColor;
    if (body.iconColor !== undefined) updates.iconColor = body.iconColor;

    const [updated] = await db
      .update(templateFolders)
      .set(updates)
      .where(and(eq(templateFolders.id, folderId), eq(templateFolders.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update template folder:', error);
    return NextResponse.json({ error: 'Failed to update template folder' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    const { id } = await params;
    const folderId = parseInt(id);
    if (isNaN(folderId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await db.delete(templateFolders).where(and(eq(templateFolders.id, folderId), eq(templateFolders.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete template folder:', error);
    return NextResponse.json({ error: 'Failed to delete template folder' }, { status: 500 });
  }
}
