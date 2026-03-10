import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { folders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  const folderId = request.nextUrl.searchParams.get('folderId');
  if (!folderId) {
    return NextResponse.json([]);
  }

  const id = parseInt(folderId);
  if (isNaN(id)) {
    return NextResponse.json([]);
  }

  try {
    const userId = getUserId(request);
    const path: { id: number; name: string }[] = [];
    let currentId: number | null = id;

    while (currentId !== null) {
      const [folder] = await db
        .select({ id: folders.id, name: folders.name, parentId: folders.parentId })
        .from(folders)
        .where(and(eq(folders.id, currentId), eq(folders.userId, userId)));

      if (!folder) break;
      path.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;

      if (path.length > 20) break;
    }

    return NextResponse.json(path);
  } catch (error) {
    console.error('Failed to fetch folder breadcrumb:', error);
    return NextResponse.json([]);
  }
}
