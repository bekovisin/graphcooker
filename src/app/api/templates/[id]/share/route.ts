import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserId, getUserRole } from '@/lib/auth/helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    const role = getUserRole(request);

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const templateId = parseInt(id);
    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const body = await request.json();
    const { userIds } = body as { userIds: number[] };

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required' }, { status: 400 });
    }

    // Fetch the original template
    const [original] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, templateId));

    if (!original) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only allow sharing templates the admin owns
    if (original.userId !== userId) {
      return NextResponse.json({ error: 'You can only share your own templates' }, { status: 403 });
    }

    // Create independent copies for each target user
    let copied = 0;
    for (const targetUserId of userIds) {
      if (targetUserId === userId) continue; // skip self
      await db.insert(templates).values({
        templateName: original.templateName,
        chartType: original.chartType,
        settings: original.settings,
        data: original.data,
        columnMapping: original.columnMapping,
        thumbnail: original.thumbnail,
        userId: targetUserId,
        sharedByUserId: userId,
      });
      copied++;
    }

    return NextResponse.json({ copied });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
