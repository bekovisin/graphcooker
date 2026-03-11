import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templates, visualizations, projects } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

// POST /api/templates/[id]/apply
// Combines template fetch + visualization creation into a single API call
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId(request);
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // 1. Fetch template
    const [template] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, id), or(eq(templates.userId, userId), eq(templates.isShared, true))));

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // 2. Create project + visualization from template data
    const [project] = await db
      .insert(projects)
      .values({ name: template.templateName, folderId: null, userId })
      .returning();

    const [visualization] = await db
      .insert(visualizations)
      .values({
        projectId: project.id,
        name: template.templateName,
        chartType: template.chartType,
        data: template.data,
        settings: template.settings,
        columnMapping: template.columnMapping,
        userId,
      })
      .returning();

    return NextResponse.json({ ...visualization, folderId: null }, { status: 201 });
  } catch (error) {
    console.error('Failed to apply template:', error);
    return NextResponse.json({ error: 'Failed to apply template' }, { status: 500 });
  }
}
