import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templates } from '@/lib/db/schema';
import { desc, eq, or } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const result = await db
      .select()
      .from(templates)
      .where(or(eq(templates.userId, userId), eq(templates.isShared, true)))
      .orderBy(desc(templates.updatedAt));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = await request.json();
    const { templateName, chartType, settings, data, columnMapping, thumbnail } = body;

    if (!templateName) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    const [template] = await db
      .insert(templates)
      .values({
        templateName,
        chartType: chartType || 'bar_stacked_custom',
        settings: settings || {},
        data: data || [],
        columnMapping: columnMapping || {},
        thumbnail: thumbnail || null,
        userId,
      })
      .returning();

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
