import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { folders, projects, visualizations } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

interface CreatedFolder {
  id: number;
  userId: number;
  name: string;
  parentId: number | null;
  createdAt: Date;
  deletedAt: Date | null;
}

interface CreatedViz {
  id: number;
  projectId: number;
  name: string;
  chartType: string;
  thumbnail: string | null;
  createdAt: Date;
  updatedAt: Date;
  folderId: number | null;
}

async function duplicateFolderRecursive(
  originalFolderId: number,
  newParentId: number | null,
  userId: number,
  isRoot: boolean,
  collectedFolders: CreatedFolder[],
  collectedVizs: CreatedViz[]
) {
  // 1. Find original folder
  const [original] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, originalFolderId), isNull(folders.deletedAt), eq(folders.userId, userId)));

  if (!original) return;

  // 2. Create new folder
  const [newFolder] = await db
    .insert(folders)
    .values({
      name: isRoot ? `${original.name} (copy)` : original.name,
      parentId: newParentId,
      userId,
    })
    .returning();

  collectedFolders.push(newFolder);

  // 3. Find projects in this folder
  const folderProjects = await db
    .select()
    .from(projects)
    .where(and(eq(projects.folderId, originalFolderId), isNull(projects.deletedAt), eq(projects.userId, userId)));

  // 4. Duplicate each project + its visualization
  for (const proj of folderProjects) {
    const [newProject] = await db
      .insert(projects)
      .values({
        name: proj.name,
        folderId: newFolder.id,
        userId,
      })
      .returning();

    const vizs = await db
      .select()
      .from(visualizations)
      .where(and(eq(visualizations.projectId, proj.id), isNull(visualizations.deletedAt)));

    for (const viz of vizs) {
      const [newViz] = await db
        .insert(visualizations)
        .values({
          projectId: newProject.id,
          name: viz.name,
          chartType: viz.chartType,
          data: viz.data,
          settings: viz.settings,
          columnMapping: viz.columnMapping,
          thumbnail: viz.thumbnail,
          userId,
        })
        .returning();

      collectedVizs.push({
        id: newViz.id,
        projectId: newViz.projectId,
        name: newViz.name,
        chartType: newViz.chartType,
        thumbnail: newViz.thumbnail,
        createdAt: newViz.createdAt,
        updatedAt: newViz.updatedAt,
        folderId: newFolder.id,
      });
    }
  }

  // 5. Find child folders and recurse
  const childFolders = await db
    .select()
    .from(folders)
    .where(and(eq(folders.parentId, originalFolderId), isNull(folders.deletedAt), eq(folders.userId, userId)));

  for (const child of childFolders) {
    await duplicateFolderRecursive(child.id, newFolder.id, userId, false, collectedFolders, collectedVizs);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId(request);
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const collectedFolders: CreatedFolder[] = [];
    const collectedVizs: CreatedViz[] = [];

    await duplicateFolderRecursive(id, null, userId, true, collectedFolders, collectedVizs);

    if (collectedFolders.length === 0) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Set parentId of root folder to match original's parentId
    const [original] = await db
      .select({ parentId: folders.parentId })
      .from(folders)
      .where(eq(folders.id, id));

    if (original && original.parentId !== null) {
      const rootFolder = collectedFolders[0];
      await db
        .update(folders)
        .set({ parentId: original.parentId })
        .where(eq(folders.id, rootFolder.id));
      rootFolder.parentId = original.parentId;
    }

    return NextResponse.json({
      folders: collectedFolders,
      visualizations: collectedVizs,
    });
  } catch (error) {
    console.error('Failed to duplicate folder:', error);
    return NextResponse.json({ error: 'Failed to duplicate folder' }, { status: 500 });
  }
}
