import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualizations, projects, folders } from '@/lib/db/schema';
import { isNotNull, eq, desc } from 'drizzle-orm';

// GET: List all soft-deleted items
export async function GET() {
  try {
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
      .where(isNotNull(visualizations.deletedAt))
      .orderBy(desc(visualizations.deletedAt));

    const deletedFolders = await db
      .select()
      .from(folders)
      .where(isNotNull(folders.deletedAt))
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

// DELETE: Empty trash (permanently delete all trashed items)
export async function DELETE() {
  try {
    // Get all trashed visualizations to find their project IDs
    const trashedViz = await db
      .select({ id: visualizations.id, projectId: visualizations.projectId })
      .from(visualizations)
      .where(isNotNull(visualizations.deletedAt));

    // Permanently delete all trashed visualizations
    if (trashedViz.length > 0) {
      await db.delete(visualizations).where(isNotNull(visualizations.deletedAt));
    }

    // Clean up orphaned projects (soft-deleted or with no remaining visualizations)
    const projectIds = Array.from(new Set(trashedViz.map((v) => v.projectId)));
    for (const projId of projectIds) {
      const remaining = await db
        .select({ id: visualizations.id })
        .from(visualizations)
        .where(eq(visualizations.projectId, projId))
        .limit(1);
      if (remaining.length === 0) {
        await db.delete(projects).where(eq(projects.id, projId));
      }
    }

    // Also delete any remaining soft-deleted projects
    await db.delete(projects).where(isNotNull(projects.deletedAt));

    // Permanently delete all trashed folders
    await db.delete(folders).where(isNotNull(folders.deletedAt));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to empty trash:', error);
    return NextResponse.json({ error: 'Failed to empty trash' }, { status: 500 });
  }
}
