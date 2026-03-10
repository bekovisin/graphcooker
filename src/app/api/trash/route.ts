import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualizations, projects, folders } from '@/lib/db/schema';
import { isNotNull, eq, desc, and } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const deletedViz = await db
      .select({
        id: visualizations.id,
        name: visualizations.name,
        chartType: visualizations.chartType,
        thumbnail: visualizations.thumbnail,
        deletedAt: visualizations.deletedAt,
        projectId: visualizations.projectId,
        folderId: projects.folderId,
      })
      .from(visualizations)
      .leftJoin(projects, eq(visualizations.projectId, projects.id))
      .where(and(isNotNull(visualizations.deletedAt), eq(visualizations.userId, userId)))
      .orderBy(desc(visualizations.deletedAt));

    const deletedFolders = await db
      .select()
      .from(folders)
      .where(and(isNotNull(folders.deletedAt), eq(folders.userId, userId)))
      .orderBy(desc(folders.deletedAt));

    return NextResponse.json({
      visualizations: deletedViz,
      folders: deletedFolders,
    });
  } catch (error) {
    console.error('Failed to list trash:', error);
    return NextResponse.json({ error: 'Failed to list trash' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request);

    const trashedViz = await db
      .select({ id: visualizations.id, projectId: visualizations.projectId })
      .from(visualizations)
      .where(and(isNotNull(visualizations.deletedAt), eq(visualizations.userId, userId)));

    if (trashedViz.length > 0) {
      for (const viz of trashedViz) {
        await db.delete(visualizations).where(and(eq(visualizations.id, viz.id), eq(visualizations.userId, userId)));
      }
    }

    const projectIds = Array.from(new Set(trashedViz.map((v) => v.projectId)));
    for (const projId of projectIds) {
      const remaining = await db
        .select({ id: visualizations.id })
        .from(visualizations)
        .where(eq(visualizations.projectId, projId))
        .limit(1);
      if (remaining.length === 0) {
        await db.delete(projects).where(and(eq(projects.id, projId), eq(projects.userId, userId)));
      }
    }

    await db.delete(projects).where(and(isNotNull(projects.deletedAt), eq(projects.userId, userId)));
    await db.delete(folders).where(and(isNotNull(folders.deletedAt), eq(folders.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to empty trash:', error);
    return NextResponse.json({ error: 'Failed to empty trash' }, { status: 500 });
  }
}
