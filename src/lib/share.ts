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

function buildItemShareMessage(title: string, url: string): string {
  return `Confira este conteúdo: ${title}\n${url}`;
}

export function buildItemShareUrl(itemId: string): string | null {
  if (typeof window === 'undefined' || !window.location.origin) return null;
  const sharePath = buildItemSharePath(itemId);
  if (!sharePath) return null;

  const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  const baseOrigin = configuredOrigin || window.location.origin;

  return buildAbsoluteUrl(sharePath, baseOrigin);
}

async function copyItemMessage(message: string, url: string): Promise<ItemShareResult> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return { status: 'unsupported', url };
  }

  try {
    await navigator.clipboard.writeText(message);
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

  const shareMessage = buildItemShareMessage(title, url);
  const shareData = {
    text: shareMessage,
  };

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
        return copyItemMessage(shareMessage, url);
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

      const clipboardResult = await copyItemMessage(shareMessage, url);
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

  return copyItemMessage(shareMessage, url);
}
