import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualizations } from '@/lib/db/schema';
import { inArray, isNull, and, eq } from 'drizzle-orm';
import { deriveExportDimensions } from '@/lib/export/deriveExportDimensions';
import { getUserId } from '@/lib/auth/helpers';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = await request.json();
    const ids: number[] = body.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({});
    }

    const rows = await db
      .select({
        id: visualizations.id,
        settings: visualizations.settings,
        columnMapping: visualizations.columnMapping,
      })
      .from(visualizations)
      .where(and(inArray(visualizations.id, ids), isNull(visualizations.deletedAt), eq(visualizations.userId, userId)));

    const result: Record<number, { width: number; height: number }> = {};

    for (const row of rows) {
      result[row.id] = deriveExportDimensions(
        row.settings as Record<string, unknown> | null,
        row.columnMapping as Record<string, unknown> | null
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch visualization dimensions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dimensions' },
      { status: 500 }
    );
  }
}
