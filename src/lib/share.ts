import { buildAbsoluteUrl, buildItemSharePath } from './sharePreview';

export type ItemShareStatus = 'shared' | 'copied' | 'unsupported' | 'error';

export type ItemShareResult = {
  status: ItemShareStatus;
  url?: string;
  reason?: 'cancelled' | 'invalid-id' | 'missing-origin' | 'share-failed' | 'clipboard-failed';
  error?: unknown;
};

type ShareItemOptions = {
  itemId: string;
  title: string;
};

export function buildItemShareUrl(itemId: string): string | null {
  if (typeof window === 'undefined' || !window.location.origin) return null;
  const sharePath = buildItemSharePath(itemId);
  if (!sharePath) return null;
  return buildAbsoluteUrl(sharePath, window.location.origin);
}

async function copyItemUrl(url: string): Promise<ItemShareResult> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return { status: 'unsupported', url };
  }

  try {
    await navigator.clipboard.writeText(url);
    return { status: 'copied', url };
  } catch (error) {
    return {
      status: 'error',
      url,
      reason: 'clipboard-failed',
      error,
    };
  }
}

export async function shareItemLink({ itemId, title }: ShareItemOptions): Promise<ItemShareResult> {
  const url = buildItemShareUrl(itemId);
  if (!url) {
    return {
      status: 'error',
      reason: itemId.trim() ? 'missing-origin' : 'invalid-id',
    };
  }

  const shareData = {
    title,
    text: `Confira este conteudo: ${title}`,
    url,
  };

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
        return copyItemUrl(url);
      }

      await navigator.share(shareData);
      return { status: 'shared', url };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          status: 'error',
          url,
          reason: 'cancelled',
          error,
        };
      }

      const clipboardResult = await copyItemUrl(url);
      if (clipboardResult.status !== 'error') {
        return clipboardResult;
      }

      return {
        status: 'error',
        url,
        reason: 'share-failed',
        error,
      };
    }
  }

  return copyItemUrl(url);
}
