import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { folders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
    // Walk up the folder tree to build the breadcrumb path
    const path: { id: number; name: string }[] = [];
    let currentId: number | null = id;

    while (currentId !== null) {
      const [folder] = await db
        .select({ id: folders.id, name: folders.name, parentId: folders.parentId })
        .from(folders)
        .where(eq(folders.id, currentId));

      if (!folder) break;
      path.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;

      // Safety: prevent infinite loops
      if (path.length > 20) break;
    }

    return NextResponse.json(path);
  } catch (error) {
    console.error('Failed to fetch folder breadcrumb:', error);
    return NextResponse.json([]);
  }
}
