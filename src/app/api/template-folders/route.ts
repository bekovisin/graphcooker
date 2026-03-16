import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templateFolders, users } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const result = await db
      .select({
        id: templateFolders.id,
        userId: templateFolders.userId,
        name: templateFolders.name,
        parentId: templateFolders.parentId,
        sharedByUserId: templateFolders.sharedByUserId,
        sharedByName: users.name,
        bgColor: templateFolders.bgColor,
        textColor: templateFolders.textColor,
        iconColor: templateFolders.iconColor,
        createdAt: templateFolders.createdAt,
      })
      .from(templateFolders)
      .leftJoin(users, eq(templateFolders.sharedByUserId, users.id))
      .where(eq(templateFolders.userId, userId))
      .orderBy(asc(templateFolders.name));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch template folders:', error);
    return NextResponse.json({ error: 'Failed to fetch template folders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = await request.json();
    const name = body.name || 'New folder';

    const [folder] = await db
      .insert(templateFolders)
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
    console.error('Failed to create template folder:', error);
    return NextResponse.json({ error: 'Failed to create template folder' }, { status: 500 });
  }
}
