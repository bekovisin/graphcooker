import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualizations } from '@/lib/db/schema';
import { inArray, eq, and } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * Batch fetch thumbnails for visualizations.
 * GET /api/visualizations/thumbnails?ids=1,2,3
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

    // Fetch in batches of 50 to avoid overly large queries
    const result: Record<string, string | null> = {};
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      const rows = await db
        .select({ id: visualizations.id, thumbnail: visualizations.thumbnail })
        .from(visualizations)
        .where(and(
          inArray(visualizations.id, batch),
          eq(visualizations.userId, userId),
        ));
      for (const row of rows) {
        if (row.thumbnail) {
          result[String(row.id)] = row.thumbnail;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch thumbnails:', error);
    return NextResponse.json({ error: 'Failed to fetch thumbnails' }, { status: 500 });
  }
}
