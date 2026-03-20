import { createClient } from '@supabase/supabase-js';

const APP_NAME = 'Manual de Bolso';
const APP_DESCRIPTION = 'Toques de corneta, manuais, bizus e cancoes na palma da mao';
const APP_OG_IMAGE_PATH = '/icons/icon-512.png';
const SHARE_REDIRECT_DELAY_SECONDS = 0;

function normalizeEnvValue(value) {
  if (!value) return undefined;
  const normalized = String(value).trim().replace(/^['"]+|['"]+$/g, '');
  return normalized || undefined;
}

function isValidHttpUrl(value) {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function getConfiguredPublicOrigin() {
  const publicAppUrl =
    normalizeEnvValue(process.env.PUBLIC_APP_URL) ||
    normalizeEnvValue(process.env.VITE_PUBLIC_APP_URL);

  if (!isValidHttpUrl(publicAppUrl)) return null;

  return new URL(publicAppUrl).origin;
}

function buildRequestOrigin(headers = {}) {
  const forwardedProto = String(headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const host = String(headers['x-forwarded-host'] || headers.host || '').split(',')[0].trim();
  const protocol = forwardedProto || 'https';

  if (!host) return null;

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return null;
  }
}

function buildAbsoluteUrl(path, origin) {
  const normalizedOrigin = String(origin || '').trim();
  if (!normalizedOrigin) return null;

  try {
    return new URL(path, normalizedOrigin).toString();
  } catch {
    return null;
  }
}

function getDefaultOgImageUrl(origin) {
  return buildAbsoluteUrl(APP_OG_IMAGE_PATH, origin);
}

function stripHtml(value = '') {
  return String(value)
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

function truncateText(value, maxLength) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function getItemTypeFallbackLabel(type) {
  const normalized = String(type || '').trim().toLowerCase();

  switch (normalized) {
    case 'pdf':
      return 'pdf';
    case 'audio':
      return 'audio';
    case 'video':
      return 'video';
    case 'image':
      return 'imagem';
    case 'text':
      return 'texto';
    default:
      return normalized || 'conteudo';
  }
}

function getItemPreviewDescription(item) {
  const description = String(item?.description || '').trim();
  if (description) return truncateText(description, 180);

  const bodyText = stripHtml(item?.text_body);
  if (bodyText) return truncateText(bodyText, 180);

  return `Conteudo do tipo ${getItemTypeFallbackLabel(item?.type)} disponivel no ${APP_NAME}.`;
}

function normalizeStoragePath(path) {
  return String(path || '').trim().replace(/^\/+/, '').replace(/^content\/+/i, '');
}

function getItemPreviewImageUrl(item, origin, contentBucketPublicUrl) {
  if (item?.type !== 'image') {
    return getDefaultOgImageUrl(origin);
  }

  const storagePath = String(item?.storage_path || '').trim();
  if (storagePath) {
    if (/^https?:\/\//i.test(storagePath)) return storagePath;

    const normalizedPath = normalizeStoragePath(storagePath);
    if (normalizedPath) {
      return contentBucketPublicUrl(normalizedPath);
    }
  }

  const externalLink = String(item?.link || '').trim();
  if (externalLink && /^https?:\/\//i.test(externalLink)) {
    return externalLink;
  }

  return getDefaultOgImageUrl(origin);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSupabaseClient() {
  const supabaseUrl = normalizeEnvValue(process.env.VITE_SUPABASE_URL);
  const supabaseAnonKey = normalizeEnvValue(process.env.VITE_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function fetchPublishedItem(supabase, itemId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('items')
    .select('id, title, description, type, category_id, published, letter, storage_path, text_body, link, tags')
    .eq('id', itemId)
    .eq('published', true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function buildItemSharePath(itemId) {
  const normalizedItemId = String(itemId || '').trim();
  if (!normalizedItemId) return null;

  return `/share/item/${encodeURIComponent(normalizedItemId)}`;
}

function createHtmlResponse(statusCode, html, cacheControl) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...(cacheControl ? { 'Cache-Control': cacheControl } : {}),
    },
    body: html,
  };
}

function renderHtml(meta, bodyMessage) {
  const escapedTitle = escapeHtml(meta.title);
  const escapedDescription = escapeHtml(meta.description);
  const escapedImageUrl = escapeHtml(meta.imageUrl);
  const escapedCanonicalUrl = escapeHtml(meta.canonicalUrl);
  const escapedBodyMessage = escapeHtml(bodyMessage);
  const redirectMeta = meta.redirectUrl
    ? `<meta http-equiv="refresh" content="${SHARE_REDIRECT_DELAY_SECONDS};url=${escapeHtml(meta.redirectUrl)}" />`
    : '';
  const redirectScript = meta.redirectUrl
    ? `<script>window.location.replace(${JSON.stringify(meta.redirectUrl)});</script>`
    : '';
  const redirectLink = meta.redirectUrl
    ? `<p><a href="${escapeHtml(meta.redirectUrl)}">Abrir conteudo no app</a></p>`
    : '<p><a href="/">Voltar para a home</a></p>';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapedDescription}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDescription}" />
    <meta property="og:image" content="${escapedImageUrl}" />
    <meta property="og:url" content="${escapedCanonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDescription}" />
    <meta name="twitter:image" content="${escapedImageUrl}" />
    <meta name="robots" content="noindex,nofollow" />
    <link rel="canonical" href="${escapedCanonicalUrl}" />
    ${redirectMeta}
  </head>
  <body>
    <main style="font-family: Arial, sans-serif; max-width: 640px; margin: 48px auto; padding: 0 16px; color: #111827;">
      <h1 style="font-size: 24px; margin-bottom: 12px;">${escapedTitle}</h1>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">${escapedBodyMessage}</p>
      ${redirectLink}
    </main>
    ${redirectScript}
  </body>
</html>`;
}

function buildErrorResponse(origin, statusCode, title, description, bodyMessage) {
  const canonicalUrl = buildAbsoluteUrl('/', origin);
  const imageUrl = getDefaultOgImageUrl(origin);

  if (!canonicalUrl || !imageUrl) {
    return createHtmlResponse(
      statusCode,
      '<!doctype html><html><body>Falha ao montar a pagina de compartilhamento.</body></html>',
    );
  }

  return createHtmlResponse(
    statusCode,
    renderHtml(
      {
        title,
        description,
        imageUrl,
        canonicalUrl,
        statusCode,
      },
      bodyMessage,
    ),
  );
}

export async function createSharePreviewResponse({ itemId, headers = {} }) {
  const origin = getConfiguredPublicOrigin() || buildRequestOrigin(headers);

  if (!origin) {
    return createHtmlResponse(
      500,
      '<!doctype html><html><body>Falha ao determinar a origem do link.</body></html>',
    );
  }

  const supabase = buildSupabaseClient();
  if (!supabase) {
    return buildErrorResponse(
      origin,
      500,
      `${APP_NAME} | Preview indisponivel`,
      'A configuracao do preview compartilhado esta indisponivel no momento.',
      'Nao foi possivel montar o preview deste link agora.',
    );
  }

  const normalizedItemId = String(itemId || '').trim();
  if (!normalizedItemId) {
    return buildErrorResponse(
      origin,
      400,
      `${APP_NAME} | Link invalido`,
      'O link compartilhado esta incompleto ou malformado.',
      'O link compartilhado esta incompleto. Abra novamente a partir do app.',
    );
  }

  const item = await fetchPublishedItem(supabase, normalizedItemId);
  if (!item) {
    return buildErrorResponse(
      origin,
      404,
      `${APP_NAME} | Conteudo nao encontrado`,
      'O conteudo compartilhado nao foi encontrado ou nao esta publicado.',
      'Este conteudo nao foi encontrado ou nao esta mais disponivel.',
    );
  }

  const sharePath = buildItemSharePath(item.id);
  const redirectUrl = buildAbsoluteUrl(`/item/${encodeURIComponent(item.id)}`, origin);
  const canonicalUrl = sharePath ? buildAbsoluteUrl(sharePath, origin) : null;
  const fallbackImageUrl = getDefaultOgImageUrl(origin);

  if (!redirectUrl || !canonicalUrl || !fallbackImageUrl) {
    return createHtmlResponse(
      500,
      '<!doctype html><html><body>Falha ao gerar o link compartilhado.</body></html>',
    );
  }

  const imageUrl =
    getItemPreviewImageUrl(
      item,
      origin,
      (path) => supabase.storage.from('content').getPublicUrl(path).data.publicUrl || fallbackImageUrl,
    ) || fallbackImageUrl;

  return createHtmlResponse(
    200,
    renderHtml(
      {
        title: item.title,
        description: getItemPreviewDescription(item),
        imageUrl,
        canonicalUrl,
        redirectUrl,
        statusCode: 200,
      },
      getItemPreviewDescription(item) || APP_DESCRIPTION,
    ),
    'public, s-maxage=300, stale-while-revalidate=86400',
  );
}
