import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualizations, projects } from '@/lib/db/schema';
import { desc, eq, like, isNull, and } from 'drizzle-orm';
import { defaultChartSettings, defaultData, defaultColumnMapping } from '@/lib/chart/config';

export async function GET() {
  try {
    const result = await db
      .select({
        id: visualizations.id,
        projectId: visualizations.projectId,
        name: visualizations.name,
        chartType: visualizations.chartType,
        thumbnail: visualizations.thumbnail,
        createdAt: visualizations.createdAt,
        updatedAt: visualizations.updatedAt,
        folderId: projects.folderId,
      })
      .from(visualizations)
      .leftJoin(projects, eq(visualizations.projectId, projects.id))
      .where(isNull(visualizations.deletedAt))
      .orderBy(desc(visualizations.updatedAt));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch visualizations:', error);
    return NextResponse.json({ error: 'Failed to fetch visualizations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Auto-naming: find the first available "Untitled visualization" name
    // that doesn't conflict with any existing (non-deleted) visualization.
    let name = body.name;
    if (!name) {
      const existing = await db
        .select({ name: visualizations.name })
        .from(visualizations)
        .where(
          and(
            like(visualizations.name, 'Untitled visualization%'),
            isNull(visualizations.deletedAt),
          )
        );

      const taken = new Set(
        existing
          .map((row) => {
            const match = row.name.match(/^Untitled visualization(?:-(\d+))?$/);
            if (!match) return 0;
            return match[1] ? parseInt(match[1]) : 1;
          })
          .filter((n) => n > 0)
      );

      // Find the first available slot: 1 = "Untitled visualization", 2+ = "Untitled visualization-N"
      let slot = 1;
      while (taken.has(slot)) slot++;
      name = slot === 1 ? 'Untitled visualization' : `Untitled visualization-${slot}`;
    }

    // Create a project first
    const [project] = await db
      .insert(projects)
      .values({ name, folderId: body.folderId || null })
      .returning();

    // Create the visualization
    const [visualization] = await db
      .insert(visualizations)
      .values({
        projectId: project.id,
        name,
        chartType: body.chartType || 'bar_stacked_custom',
        data: body.data || defaultData,
        settings: body.settings || defaultChartSettings,
        columnMapping: body.columnMapping || defaultColumnMapping,
      })
      .returning();

    return NextResponse.json({ ...visualization, folderId: body.folderId || null }, { status: 201 });
  } catch (error) {
    console.error('Failed to create visualization:', error);
    return NextResponse.json({ error: 'Failed to create visualization' }, { status: 500 });
  }
}
