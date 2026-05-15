import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { designVersions } from '@/lib/db/schema';
import { desc, eq, or, isNull } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const versions = await db
      .select()
      .from(designVersions)
      .where(or(eq(designVersions.userId, userId), eq(designVersions.isBuiltIn, true), isNull(designVersions.userId)))
      .orderBy(desc(designVersions.isBuiltIn), designVersions.name);
    return NextResponse.json(versions);
  } catch (error) {
    console.error('Failed to fetch design versions:', error);
    return NextResponse.json({ error: 'Failed to fetch design versions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = await request.json();
    const { name, settings, chartType } = body;

    if (!name || !settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Name and settings object are required' },
        { status: 400 }
      );
    }

    const [version] = await db
      .insert(designVersions)
      .values({
        name,
        settings,
        chartType: chartType || null,
        isBuiltIn: false,
        userId,
      })
      .returning();

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error('Failed to create design version:', error);
    return NextResponse.json({ error: 'Failed to create design version' }, { status: 500 });
  }
}
