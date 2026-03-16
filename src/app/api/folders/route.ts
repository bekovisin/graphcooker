import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { folders, users } from '@/lib/db/schema';
import { asc, isNull, and, eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const result = await db
      .select({
        id: folders.id,
        userId: folders.userId,
        name: folders.name,
        parentId: folders.parentId,
        sharedByUserId: folders.sharedByUserId,
        sharedByName: users.name,
        bgColor: folders.bgColor,
        textColor: folders.textColor,
        iconColor: folders.iconColor,
        createdAt: folders.createdAt,
        deletedAt: folders.deletedAt,
      })
      .from(folders)
      .leftJoin(users, eq(folders.sharedByUserId, users.id))
      .where(and(isNull(folders.deletedAt), eq(folders.userId, userId)))
      .orderBy(asc(folders.name));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch folders:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = await request.json();
    const name = body.name || 'New folder';

    const [folder] = await db
      .insert(folders)
      .values({
        name,
        parentId: body.parentId || null,
        userId,
        bgColor: body.bgColor || null,
        textColor: body.textColor || null,
        iconColor: body.iconColor || null,
      })
      .returning();

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('Failed to create folder:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
