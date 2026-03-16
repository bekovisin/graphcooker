import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { imageLibrary } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    const { id } = await params;
    const [image] = await db
      .select()
      .from(imageLibrary)
      .where(eq(imageLibrary.id, parseInt(id)));

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (image.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(image);
  } catch (error) {
    console.error('Failed to fetch image:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    const { id } = await params;
    const [existing] = await db
      .select()
      .from(imageLibrary)
      .where(eq(imageLibrary.id, parseInt(id)));

    if (!existing) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, lastUsedAt } = body;

    const [updated] = await db
      .update(imageLibrary)
      .set({
        ...(name !== undefined && { name }),
        ...(lastUsedAt && { lastUsedAt: new Date(lastUsedAt) }),
        updatedAt: new Date(),
      })
      .where(eq(imageLibrary.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update image:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    const { id } = await params;
    const [existing] = await db
      .select()
      .from(imageLibrary)
      .where(eq(imageLibrary.id, parseInt(id)));

    if (!existing) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(imageLibrary).where(eq(imageLibrary.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
