import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { imageLibrary } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { getUserId, getUserRole } from '@/lib/auth/helpers';
import { validateImageDataUrl, checkUserLimits } from '@/lib/image-security';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const { searchParams } = new URL(request.url);
    const metadataOnly = searchParams.get('fields') === 'metadata';

    const images = metadataOnly
      ? await db
          .select({
            id: imageLibrary.id,
            name: imageLibrary.name,
            createdAt: imageLibrary.createdAt,
            lastUsedAt: imageLibrary.lastUsedAt,
          })
          .from(imageLibrary)
          .where(eq(imageLibrary.userId, userId))
          .orderBy(desc(imageLibrary.lastUsedAt))
      : await db
          .select()
          .from(imageLibrary)
          .where(eq(imageLibrary.userId, userId))
          .orderBy(desc(imageLibrary.lastUsedAt));

    return NextResponse.json(images);
  } catch (error) {
    console.error('Failed to fetch image library:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const role = getUserRole(request);
    const body = await request.json();
    const { name, dataUrl } = body;

    if (!name || !dataUrl) {
      return NextResponse.json(
        { error: 'Name and dataUrl are required' },
        { status: 400 }
      );
    }

    const isAdmin = role === 'admin';

    // Security validation (skipped for admins)
    let finalDataUrl = dataUrl;
    if (!isAdmin) {
      const validation = validateImageDataUrl(dataUrl);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      finalDataUrl = validation.sanitizedDataUrl || dataUrl;

      // Check per-user limits
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(imageLibrary)
        .where(eq(imageLibrary.userId, userId));

      const [storageResult] = await db
        .select({ total: sql<number>`coalesce(sum(length(${imageLibrary.dataUrl})), 0)::bigint` })
        .from(imageLibrary)
        .where(eq(imageLibrary.userId, userId));

      const limitError = checkUserLimits(
        countResult.count,
        Number(storageResult.total),
        finalDataUrl.length
      );
      if (limitError) {
        return NextResponse.json({ error: limitError }, { status: 400 });
      }
    }

    const [image] = await db
      .insert(imageLibrary)
      .values({
        name,
        dataUrl: finalDataUrl,
        userId,
      })
      .returning();

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Failed to create image:', error);
    return NextResponse.json({ error: 'Failed to create image' }, { status: 500 });
  }
}
