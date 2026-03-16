import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templates } from '@/lib/db/schema';
import { inArray, eq, or, and } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

/**
 * Batch fetch thumbnails for templates.
 * GET /api/templates/thumbnails?ids=1,2,3
 * Returns { "1": "data:image/jpeg;base64,...", "2": "...", ... }
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ error: 'ids parameter required' }, { status: 400 });
    }

    const ids = idsParam.split(',').map(Number).filter((n) => !isNaN(n));
    if (ids.length === 0) {
      return NextResponse.json({});
    }

    const result: Record<string, string | null> = {};
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      const rows = await db
        .select({ id: templates.id, thumbnail: templates.thumbnail })
        .from(templates)
        .where(and(
          inArray(templates.id, batch),
          or(eq(templates.userId, userId), eq(templates.isShared, true)),
        ));
      for (const row of rows) {
        if (row.thumbnail) {
          result[String(row.id)] = row.thumbnail;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch template thumbnails:', error);
    return NextResponse.json({ error: 'Failed to fetch thumbnails' }, { status: 500 });
  }
}
