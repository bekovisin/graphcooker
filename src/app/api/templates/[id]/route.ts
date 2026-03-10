import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templates } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId(request);
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [template] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, id), or(eq(templates.userId, userId), eq(templates.isShared, true))));

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Failed to fetch template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

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
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.templateName !== undefined) updates.templateName = body.templateName;
    if (body.chartType !== undefined) updates.chartType = body.chartType;
    if (body.settings !== undefined) updates.settings = body.settings;
    if (body.data !== undefined) updates.data = body.data;
    if (body.columnMapping !== undefined) updates.columnMapping = body.columnMapping;
    if (body.thumbnail !== undefined) updates.thumbnail = body.thumbnail;

    const [updated] = await db
      .update(templates)
      .set(updates)
      .where(and(eq(templates.id, id), eq(templates.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
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

    await db.delete(templates).where(and(eq(templates.id, id), eq(templates.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
