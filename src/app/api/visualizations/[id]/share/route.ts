import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualizations, projects, users } from '@/lib/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { getUserId, getUserRole } from '@/lib/auth/helpers';


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    const role = getUserRole(request);

    const { id } = await params;
    const vizId = parseInt(id);
    if (isNaN(vizId)) {
      return NextResponse.json({ error: 'Invalid visualization ID' }, { status: 400 });
    }

    const body = await request.json();
    const { userIds, emails } = body as { userIds?: number[]; emails?: string[] };

    // Resolve target user IDs
    let targetUserIds: number[] = [];

    if (role === 'admin' && Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds;
    } else if (Array.isArray(emails) && emails.length > 0) {
      // Look up users by email — silently skip unregistered emails
      const foundUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.email, emails));
      targetUserIds = foundUsers.map((u) => u.id);
    }

    if (targetUserIds.length === 0) {
      // Always return success to prevent account enumeration
      return NextResponse.json({ shared: true });
    }

    // Fetch the original visualization
    const [original] = await db
      .select()
      .from(visualizations)
      .where(and(eq(visualizations.id, vizId), isNull(visualizations.deletedAt)));

    if (!original) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
    }

    if (original.userId !== userId) {
      return NextResponse.json({ error: 'You can only share your own visualizations' }, { status: 403 });
    }

    const targetUsers = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(inArray(users.id, targetUserIds));

    for (const targetUser of targetUsers) {
      if (targetUser.id === userId) continue; // skip self

      // Create project for the copy
      const [newProject] = await db
        .insert(projects)
        .values({
          name: original.name,
          folderId: null,
          userId: targetUser.id,
        })
        .returning();

      // Create visualization copy
      await db.insert(visualizations).values({
        projectId: newProject.id,
        name: original.name,
        chartType: original.chartType,
        data: original.data,
        settings: original.settings,
        columnMapping: original.columnMapping,
        thumbnail: original.thumbnail,
        userId: targetUser.id,
        sharedByUserId: userId,
      });

      // No email for individual visualization shares
    }

    return NextResponse.json({ shared: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
