import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualizations, projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [visualization] = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.id, id));

    if (!visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
    }

    return NextResponse.json(visualization);
  } catch (error) {
    console.error('Failed to fetch visualization:', error);
    return NextResponse.json({ error: 'Failed to fetch visualization' }, { status: 500 });
  }
}

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
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.data !== undefined) updateData.data = body.data;
    if (body.settings !== undefined) updateData.settings = body.settings;
    if (body.columnMapping !== undefined) updateData.columnMapping = body.columnMapping;
    if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail;
    if (body.chartType !== undefined) updateData.chartType = body.chartType;

    const [updated] = await db
      .update(visualizations)
      .set(updateData)
      .where(eq(visualizations.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
    }

    // If folderId is provided, update the project's folder
    if (body.folderId !== undefined) {
      await db
        .update(projects)
        .set({ folderId: body.folderId })
        .where(eq(projects.id, updated.projectId));
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update visualization:', error);
    return NextResponse.json({ error: 'Failed to update visualization' }, { status: 500 });
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

    const [deleted] = await db
      .delete(visualizations)
      .where(eq(visualizations.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete visualization:', error);
    return NextResponse.json({ error: 'Failed to delete visualization' }, { status: 500 });
  }
}
