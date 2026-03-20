import { Item } from '../types';
import { getItemTypeLabel } from './itemTypeLabel';

export const APP_NAME = 'Manual de Bolso';
export const APP_DESCRIPTION = 'Toques de corneta, manuais, bizus e cancoes na palma da mao';
export const APP_OG_IMAGE_PATH = '/icons/icon-512.png';
export const SHARE_REDIRECT_DELAY_SECONDS = 0;

function normalizeItemId(itemId: string): string {
  return itemId.trim();
}

export function buildItemSharePath(itemId: string): string | null {
  const normalizedItemId = normalizeItemId(itemId);
  if (!normalizedItemId) return null;
  return `/share/item/${encodeURIComponent(normalizedItemId)}`;
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

export function getDefaultOgImageUrl(origin: string): string | null {
  return buildAbsoluteUrl(APP_OG_IMAGE_PATH, origin);
}

export function stripHtml(value?: string): string {
  if (!value) return '';

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateText(value: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

export function getItemPreviewDescription(item: Item): string {
  const description = item.description?.trim();
  if (description) return truncateText(description, 180);

  const bodyText = stripHtml(item.text_body);
  if (bodyText) return truncateText(bodyText, 180);

  const typeLabel = getItemTypeLabel(item.type).toLowerCase();
  return `Conteudo do tipo ${typeLabel} disponivel no ${APP_NAME}.`;
}

export function normalizeStoragePath(path: string): string {
  return path.trim().replace(/^\/+/, '').replace(/^content\/+/i, '');
}

export function getItemPreviewImageUrl(item: Item, origin: string, contentBucketPublicUrl: (path: string) => string): string | null {
  if (item.type !== 'image') {
    return getDefaultOgImageUrl(origin);
  }

  const storagePath = item.storage_path?.trim();
  if (storagePath) {
    if (/^https?:\/\//i.test(storagePath)) return storagePath;

    const normalizedPath = normalizeStoragePath(storagePath);
    if (normalizedPath) {
      return contentBucketPublicUrl(normalizedPath);
    }
  }

  const externalLink = item.link?.trim();
  if (externalLink && /^https?:\/\//i.test(externalLink)) {
    return externalLink;
  }

  return getDefaultOgImageUrl(origin);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
