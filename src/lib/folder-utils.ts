/**
 * Returns the set of all descendant folder IDs for a given folder.
 * Used to prevent circular references when moving folders.
 */
export function getDescendantIds(
  folderId: number,
  folders: { id: number; parentId: number | null }[]
): Set<number> {
  const descendants = new Set<number>();
  const queue = [folderId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const f of folders) {
      if (f.parentId === current && !descendants.has(f.id)) {
        descendants.add(f.id);
        queue.push(f.id);
      }
    }
  }
  return descendants;
}
