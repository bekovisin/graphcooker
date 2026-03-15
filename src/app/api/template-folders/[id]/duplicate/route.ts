import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templateFolders, templates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

interface CreatedFolder {
  id: number;
  userId: number;
  name: string;
  parentId: number | null;
  createdAt: Date;
}

interface CreatedTemplate {
  id: number;
  userId: number;
  templateName: string;
  chartType: string;
  thumbnail: string | null;
  folderId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

async function duplicateTemplateFolderRecursive(
  originalFolderId: number,
  newParentId: number | null,
  userId: number,
  isRoot: boolean,
  collectedFolders: CreatedFolder[],
  collectedTemplates: CreatedTemplate[]
) {
  // 1. Find original folder
  const [original] = await db
    .select()
    .from(templateFolders)
    .where(eq(templateFolders.id, originalFolderId));

  if (!original || original.userId !== userId) return;

  // 2. Create new folder
  const [newFolder] = await db
    .insert(templateFolders)
    .values({
      name: isRoot ? `${original.name} (copy)` : original.name,
      parentId: newParentId,
      userId,
    })
    .returning();

  collectedFolders.push(newFolder);

  // 3. Find templates in this folder
  const folderTemplates = await db
    .select()
    .from(templates)
    .where(eq(templates.folderId, originalFolderId));

  // 4. Duplicate each template
  for (const tpl of folderTemplates) {
    if (tpl.userId !== userId) continue;

    const [newTemplate] = await db
      .insert(templates)
      .values({
        templateName: tpl.templateName,
        chartType: tpl.chartType,
        settings: tpl.settings,
        data: tpl.data,
        columnMapping: tpl.columnMapping,
        thumbnail: tpl.thumbnail,
        folderId: newFolder.id,
        userId,
      })
      .returning();

    collectedTemplates.push({
      id: newTemplate.id,
      userId: newTemplate.userId,
      templateName: newTemplate.templateName,
      chartType: newTemplate.chartType,
      thumbnail: newTemplate.thumbnail,
      folderId: newFolder.id,
      createdAt: newTemplate.createdAt,
      updatedAt: newTemplate.updatedAt,
    });
  }

  // 5. Find child folders and recurse
  const childFolders = await db
    .select()
    .from(templateFolders)
    .where(eq(templateFolders.parentId, originalFolderId));

  for (const child of childFolders) {
    if (child.userId !== userId) continue;
    await duplicateTemplateFolderRecursive(child.id, newFolder.id, userId, false, collectedFolders, collectedTemplates);
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
    const collectedTemplates: CreatedTemplate[] = [];

    await duplicateTemplateFolderRecursive(id, null, userId, true, collectedFolders, collectedTemplates);

    if (collectedFolders.length === 0) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Set parentId of root folder to match original's parentId
    const [original] = await db
      .select({ parentId: templateFolders.parentId })
      .from(templateFolders)
      .where(eq(templateFolders.id, id));

    if (original && original.parentId !== null) {
      const rootFolder = collectedFolders[0];
      await db
        .update(templateFolders)
        .set({ parentId: original.parentId })
        .where(eq(templateFolders.id, rootFolder.id));
      rootFolder.parentId = original.parentId;
    }

    return NextResponse.json({
      folders: collectedFolders,
      templates: collectedTemplates,
    });
  } catch (error) {
    console.error('Failed to duplicate template folder:', error);
    return NextResponse.json({ error: 'Failed to duplicate template folder' }, { status: 500 });
  }
}
