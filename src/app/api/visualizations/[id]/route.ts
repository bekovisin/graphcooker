import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualizations, projects } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
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

    const [visualization] = await db
      .select()
      .from(visualizations)
      .where(and(eq(visualizations.id, id), isNull(visualizations.deletedAt), eq(visualizations.userId, userId)));

    if (!visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
    }

    const [project] = await db
      .select({ folderId: projects.folderId })
      .from(projects)
      .where(eq(projects.id, visualization.projectId));

    return NextResponse.json({ ...visualization, folderId: project?.folderId ?? null });
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
    const userId = getUserId(request);
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
      .where(and(eq(visualizations.id, id), eq(visualizations.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
    }

    if (body.folderId !== undefined) {
      await db
        .update(projects)
        .set({ folderId: body.folderId })
        .where(and(eq(projects.id, updated.projectId), eq(projects.userId, userId)));
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
    const userId = getUserId(request);
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const now = new Date();

    const [softDeleted] = await db
      .update(visualizations)
      .set({ deletedAt: now })
      .where(and(eq(visualizations.id, id), isNull(visualizations.deletedAt), eq(visualizations.userId, userId)))
      .returning();

    if (!softDeleted) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
    }

    await db
      .update(projects)
      .set({ deletedAt: now })
      .where(eq(projects.id, softDeleted.projectId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete visualization:', error);
    return NextResponse.json({ error: 'Failed to delete visualization' }, { status: 500 });
  }
}
