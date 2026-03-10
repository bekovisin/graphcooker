import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { preferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'key parameter required' }, { status: 400 });
  }
  try {
    const [result] = await db
      .select()
      .from(preferences)
      .where(eq(preferences.key, key))
      .limit(1);
    return NextResponse.json(result || null);
  } catch (error) {
    console.error('Failed to fetch preference:', error);
    return NextResponse.json({ error: 'Failed to fetch preference' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { key, value } = await request.json();
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value required' }, { status: 400 });
    }
    const [result] = await db
      .insert(preferences)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: preferences.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to save preference:', error);
    return NextResponse.json({ error: 'Failed to save preference' }, { status: 500 });
  }
}
