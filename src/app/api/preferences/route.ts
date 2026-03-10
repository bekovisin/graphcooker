import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { preferences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'key parameter required' }, { status: 400 });
  }
  try {
    const userId = getUserId(request);
    const [result] = await db
      .select()
      .from(preferences)
      .where(and(eq(preferences.key, key), eq(preferences.userId, userId)))
      .limit(1);
    return NextResponse.json(result || null);
  } catch (error) {
    console.error('Failed to fetch preference:', error);
    return NextResponse.json({ error: 'Failed to fetch preference' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const { key, value } = await request.json();
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value required' }, { status: 400 });
    }

    // Check if preference exists for this user
    const [existing] = await db
      .select()
      .from(preferences)
      .where(and(eq(preferences.key, key), eq(preferences.userId, userId)))
      .limit(1);

    let result;
    if (existing) {
      [result] = await db
        .update(preferences)
        .set({ value, updatedAt: new Date() })
        .where(and(eq(preferences.key, key), eq(preferences.userId, userId)))
        .returning();
    } else {
      [result] = await db
        .insert(preferences)
        .values({ key, value, userId, updatedAt: new Date() })
        .returning();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to save preference:', error);
    return NextResponse.json({ error: 'Failed to save preference' }, { status: 500 });
  }
}
