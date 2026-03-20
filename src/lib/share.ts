import { buildAbsoluteUrl, buildItemSharePath } from './sharePreview';

export type ItemShareStatus = 'shared' | 'copied' | 'unsupported' | 'error';

export type ItemShareResult = {
  status: ItemShareStatus;
  url?: string;
  reason?: 'cancelled' | 'invalid-id' | 'missing-origin' | 'share-failed' | 'clipboard-failed';
  error?: unknown;
};

export type ItemSharePayload = {
  title: string;
  url: string;
  message: string;
  whatsappUrl: string;
};

type ShareItemOptions = {
  itemId: string;
  title: string;
};

function buildItemShareMessage(title: string, url: string): string {
  return `Confira este conteúdo: ${title}\n\n${url}`;
}

function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildItemShareUrl(itemId: string): string | null {
  if (typeof window === 'undefined' || !window.location.origin) return null;
  const sharePath = buildItemSharePath(itemId);
  if (!sharePath) return null;

  const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  const baseOrigin = configuredOrigin || window.location.origin;

  return buildAbsoluteUrl(sharePath, baseOrigin);
}

export function buildItemSharePayload({ itemId, title }: ShareItemOptions): ItemSharePayload | null {
  const url = buildItemShareUrl(itemId);
  if (!url) return null;

  const message = buildItemShareMessage(title, url);
  return {
    title,
    url,
    message,
    whatsappUrl: buildWhatsAppShareUrl(message),
  };
}

export function canUseNativeShare(payload: ItemSharePayload): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }

  const shareData = { text: payload.message };
  if (typeof navigator.canShare === 'function') {
    return navigator.canShare(shareData);
  }

  return true;
}

export async function copyItemShareMessage(payload: ItemSharePayload): Promise<ItemShareResult> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return { status: 'unsupported', url: payload.url };
  }

  try {
    await navigator.clipboard.writeText(payload.message);
    return { status: 'copied', url: payload.url };
  } catch (error) {
    return {
      status: 'error',
      url: payload.url,
      reason: 'clipboard-failed',
      error,
    };
  }
}

export async function shareItemLink(payload: ItemSharePayload): Promise<ItemShareResult> {
  if (!canUseNativeShare(payload)) {
    return copyItemShareMessage(payload);
  }

  const shareData = {
    text: payload.message,
  };

  try {
    await navigator.share(shareData);
    return { status: 'shared', url: payload.url };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        status: 'error',
        url: payload.url,
        reason: 'cancelled',
        error,
      };
    }

    const clipboardResult = await copyItemShareMessage(payload);
    if (clipboardResult.status !== 'error') {
      return clipboardResult;
    }

    return {
      status: 'error',
      url: payload.url,
      reason: 'share-failed',
      error,
    };
  }
}
