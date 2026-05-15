import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { designVersions } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    const { id } = await params;
    const [version] = await db
      .select()
      .from(designVersions)
      .where(and(eq(designVersions.id, parseInt(id)), or(eq(designVersions.userId, userId), eq(designVersions.isBuiltIn, true))));

    if (!version) {
      return NextResponse.json({ error: 'Design version not found' }, { status: 404 });
    }

    return NextResponse.json(version);
  } catch (error) {
    console.error('Failed to fetch design version:', error);
    return NextResponse.json({ error: 'Failed to fetch design version' }, { status: 500 });
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
      .from(designVersions)
      .where(eq(designVersions.id, parseInt(id)));

    if (!existing) {
      return NextResponse.json({ error: 'Design version not found' }, { status: 404 });
    }

    if (existing.isBuiltIn) {
      return NextResponse.json(
        { error: 'Cannot modify built-in design versions' },
        { status: 403 }
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, settings, chartType } = body;

    const [updated] = await db
      .update(designVersions)
      .set({
        ...(name && { name }),
        ...(settings && { settings }),
        ...(chartType !== undefined && { chartType }),
        updatedAt: new Date(),
      })
      .where(eq(designVersions.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update design version:', error);
    return NextResponse.json({ error: 'Failed to update design version' }, { status: 500 });
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
      .from(designVersions)
      .where(eq(designVersions.id, parseInt(id)));

    if (!existing) {
      return NextResponse.json({ error: 'Design version not found' }, { status: 404 });
    }

    if (existing.isBuiltIn) {
      return NextResponse.json(
        { error: 'Cannot delete built-in design versions' },
        { status: 403 }
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(designVersions).where(eq(designVersions.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete design version:', error);
    return NextResponse.json({ error: 'Failed to delete design version' }, { status: 500 });
  }
}
