function normalizeItemId(itemId: string): string {
  return itemId.trim();
}

export function buildItemSharePath(itemId: string): string | null {
  const normalizedItemId = normalizeItemId(itemId);
  if (!normalizedItemId) return null;
  return `/item/${encodeURIComponent(normalizedItemId)}`;
}

export function buildAbsoluteUrl(path: string, origin: string): string | null {
  const normalizedOrigin = origin.trim();
  if (!normalizedOrigin) return null;

  try {
    return new URL(path, normalizedOrigin).toString();
  } catch {
    return null;
  }
}
