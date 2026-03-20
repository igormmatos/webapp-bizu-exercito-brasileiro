import { createClient } from '@supabase/supabase-js';
import {
  APP_DESCRIPTION,
  APP_NAME,
  SHARE_REDIRECT_DELAY_SECONDS,
  buildAbsoluteUrl,
  buildItemSharePath,
  escapeHtml,
  getDefaultOgImageUrl,
  getItemPreviewDescription,
  getItemPreviewImageUrl,
} from '../src/lib/sharePreview';
import { Item } from '../src/types';

type PreviewMeta = {
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string;
  redirectUrl?: string;
  statusCode: number;
};

function getEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().replace(/^['"]+|['"]+$/g, '');
  return normalized || undefined;
}

function buildOrigin(req: any): string | null {
  const forwardedProto = String(req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim();
  const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '').split(',')[0].trim();
  const protocol = forwardedProto || 'https';

  if (!host) return null;

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return null;
  }
}

function getItemId(req: any): string {
  const rawItemId = req.query?.itemId;
  if (Array.isArray(rawItemId)) return String(rawItemId[0] || '').trim();
  return String(rawItemId || '').trim();
}

function buildSupabaseClient() {
  const supabaseUrl = getEnvValue(process.env.VITE_SUPABASE_URL);
  const supabaseAnonKey = getEnvValue(process.env.VITE_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function fetchPublishedItem(supabase: ReturnType<typeof buildSupabaseClient>, itemId: string): Promise<Item | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('items')
    .select('id, title, description, type, category_id, published, letter, storage_path, text_body, link, tags')
    .eq('id', itemId)
    .eq('published', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as Item;
}

function renderHtml(meta: PreviewMeta, bodyMessage: string): string {
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

function buildErrorMeta(origin: string, statusCode: number, title: string, description: string): PreviewMeta | null {
  const canonicalUrl = buildAbsoluteUrl('/', origin);
  const imageUrl = getDefaultOgImageUrl(origin);
  if (!canonicalUrl || !imageUrl) return null;

  return {
    title,
    description,
    imageUrl,
    canonicalUrl,
    statusCode,
  };
}

export default async function handler(req: any, res: any) {
  const origin = buildOrigin(req);

  if (!origin) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html><body>Falha ao determinar a origem do link.</body></html>');
    return;
  }

  const itemId = getItemId(req);
  const supabase = buildSupabaseClient();

  if (!supabase) {
    const errorMeta = buildErrorMeta(
      origin,
      500,
      `${APP_NAME} | Preview indisponivel`,
      'A configuracao do preview compartilhado esta indisponivel no momento.',
    );

    res.statusCode = errorMeta?.statusCode || 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      errorMeta
        ? renderHtml(errorMeta, 'Nao foi possivel montar o preview deste link agora.')
        : '<!doctype html><html><body>Preview indisponivel.</body></html>',
    );
    return;
  }

  if (!itemId) {
    const errorMeta = buildErrorMeta(
      origin,
      400,
      `${APP_NAME} | Link invalido`,
      'O link compartilhado esta incompleto ou malformado.',
    );

    res.statusCode = errorMeta?.statusCode || 400;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      errorMeta
        ? renderHtml(errorMeta, 'O link compartilhado esta incompleto. Abra novamente a partir do app.')
        : '<!doctype html><html><body>Link compartilhado invalido.</body></html>',
    );
    return;
  }

  const item = await fetchPublishedItem(supabase, itemId);
  if (!item) {
    const errorMeta = buildErrorMeta(
      origin,
      404,
      `${APP_NAME} | Conteudo nao encontrado`,
      'O conteudo compartilhado nao foi encontrado ou nao esta publicado.',
    );

    res.statusCode = errorMeta?.statusCode || 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      errorMeta
        ? renderHtml(errorMeta, 'Este conteudo nao foi encontrado ou nao esta mais disponivel.')
        : '<!doctype html><html><body>Conteudo nao encontrado.</body></html>',
    );
    return;
  }

  const sharePath = buildItemSharePath(item.id);
  const redirectUrl = buildAbsoluteUrl(`/item/${encodeURIComponent(item.id)}`, origin);
  const canonicalUrl = sharePath ? buildAbsoluteUrl(sharePath, origin) : null;
  const fallbackImageUrl = getDefaultOgImageUrl(origin);

  if (!redirectUrl || !canonicalUrl || !fallbackImageUrl) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html><body>Falha ao gerar o link compartilhado.</body></html>');
    return;
  }

  const imageUrl = getItemPreviewImageUrl(
    item,
    origin,
    (path) => supabase?.storage.from('content').getPublicUrl(path).data.publicUrl || fallbackImageUrl,
  ) || fallbackImageUrl;

  const meta: PreviewMeta = {
    title: item.title,
    description: getItemPreviewDescription(item),
    imageUrl,
    canonicalUrl,
    redirectUrl,
    statusCode: 200,
  };

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.end(renderHtml(meta, meta.description || APP_DESCRIPTION));
}
