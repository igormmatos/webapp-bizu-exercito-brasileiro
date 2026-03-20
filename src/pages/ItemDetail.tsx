import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getItemById } from '../lib/catalogApi';
import { isFavorite, toggleFavorite } from '../lib/favoritesCache';
import { Item } from '../types';
import { ArrowLeft, Heart, AlertTriangle, ExternalLink, FileText, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DOMPurify from 'dompurify';
import { getItemTypeLabel } from '../lib/itemTypeLabel';
import { shareItemLink } from '../lib/share';

type ShareFeedback = {
  tone: 'success' | 'error';
  message: string;
};

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<ShareFeedback | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  useEffect(() => {
    if (!shareFeedback) return;

    const timeoutId = window.setTimeout(() => {
      setShareFeedback(null);
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [shareFeedback]);

  const loadData = async (itemId: string) => {
    setLoading(true);
    const data = await getItemById(itemId);
    setItem(data || null);
    if (data) {
      const fav = await isFavorite(itemId);
      setIsFav(fav);
    }
    setLoading(false);
  };

  const handleToggleFavorite = async () => {
    if (!id) return;
    const newStatus = await toggleFavorite(id);
    setIsFav(newStatus);
  };

  const handleShare = async () => {
    if (!item) return;

    const result = await shareItemLink({
      itemId: item.id,
      title: item.title,
    });

    if (result.status === 'shared') {
      setShareFeedback({
        tone: 'success',
        message: 'Compartilhamento aberto com o link deste conteudo.',
      });
      return;
    }

    if (result.status === 'copied') {
      setShareFeedback({
        tone: 'success',
        message: 'Link copiado para a area de transferencia.',
      });
      return;
    }

    if (result.status === 'unsupported') {
      setShareFeedback({
        tone: 'error',
        message: 'Este dispositivo nao suporta compartilhamento nem copia de link.',
      });
      return;
    }

    if (result.reason === 'cancelled') {
      setShareFeedback(null);
      return;
    }

    setShareFeedback({
      tone: 'error',
      message:
        result.reason === 'invalid-id'
          ? 'Nao foi possivel gerar um link valido para este conteudo.'
          : 'Nao foi possivel compartilhar este conteudo agora.',
    });
  };

  const decodeHtmlEntities = (value: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  };

  const parseLyricsStanzas = (rawText?: string) => {
    if (!rawText) return [] as string[][];

    const normalized = decodeHtmlEntities(
      rawText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<[^>]+>/g, ''),
    );

    const lines = normalized.split('\n').map((line) => line.trim());
    const stanzas: string[][] = [];
    let currentStanza: string[] = [];

    for (const line of lines) {
      if (!line) {
        if (currentStanza.length > 0) {
          stanzas.push(currentStanza);
          currentStanza = [];
        }
        continue;
      }
      currentStanza.push(line);
    }

    if (currentStanza.length > 0) {
      stanzas.push(currentStanza);
    }

    return stanzas;
  };

  const getSongMeta = (currentItem: Item) => {
    const firstTag = currentItem.tags?.find((tag) => tag.trim().length > 0);
    const mode = firstTag ? firstTag : currentItem.type;
    return `CANCAO MILITAR · ${mode}`.toUpperCase();
  };

  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();

      if (host.includes('youtu.be')) {
        const videoId = parsed.pathname.replace(/^\/+/, '');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
      }

      if (host.includes('youtube.com')) {
        if (parsed.pathname.startsWith('/embed/')) return trimmed;
        if (parsed.pathname === '/watch') {
          const videoId = parsed.searchParams.get('v');
          return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
        }
      }
    } catch {
      // Fallback for non-standard URLs.
    }

    return trimmed.replace('watch?v=', 'embed/');
  };

  const normalizeStoragePath = (path: string) => {
    return path.trim().replace(/^\/+/, '').replace(/^content\/+/i, '');
  };

  const getPublicUrl = (path?: string) => {
    if (!path) return '';
    const cleanedPath = path.trim();
    if (/^https?:\/\//i.test(cleanedPath)) return cleanedPath;
    if (!supabase) return '';

    const normalizedPath = normalizeStoragePath(cleanedPath);
    if (!normalizedPath) return '';

    const { data } = supabase.storage.from('content').getPublicUrl(normalizedPath);
    return data.publicUrl;
  };

  const getExternalHttpUrl = (value?: string) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return trimmed;
      }
    } catch {
      return '';
    }
    return '';
  };

  if (loading) {
    return <div className="p-4 flex justify-center py-12 text-slate-500">Carregando...</div>;
  }

  if (!item) {
    return (
      <div className="p-4 text-center py-12">
        <h2 className="text-xl font-bold text-mil-light mb-2">Item não encontrado</h2>
        <button onClick={() => navigate(-1)} className="text-mil-gold font-medium">Voltar</button>
      </div>
    );
  }

  const isSongLayout = item.type === 'video' && item.letter === true;
  const storageUrl = item.storage_path ? getPublicUrl(item.storage_path) : '';
  const externalLinkUrl = getExternalHttpUrl(item.link);
  const mediaUrl = storageUrl || externalLinkUrl;
  const pdfStorageUrl = item.type === 'pdf' ? storageUrl : '';
  const pdfExternalUrl = item.type === 'pdf' ? externalLinkUrl : '';
  const embedUrl = getYouTubeEmbedUrl(item.link);
  const lyricsStanzas = parseLyricsStanzas(item.text_body);
  const hasLyrics = lyricsStanzas.length > 0;
  const songMeta = getSongMeta(item);
  const hasFormattedText = Boolean(item.text_body && item.text_body.trim().length > 0);
  const sanitizedTextBody = hasFormattedText ? DOMPurify.sanitize(item.text_body as string) : '';
  const isTextOrImageItem = item.type === 'text' || item.type === 'image';
  const shouldRenderTopImage = isTextOrImageItem && Boolean(mediaUrl);
  const shouldRenderTextImageBlock = isTextOrImageItem && (shouldRenderTopImage || hasFormattedText);
  const textImageBlockPadding = hasFormattedText ? 'px-6 py-8' : 'px-6 pt-6 pb-4';

  return (
    <div className="flex flex-col min-h-full bg-mil-dark text-mil-light">
      <header className="bg-mil-dark px-4 py-4 sticky top-0 z-10 border-b border-mil-medium">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-mil-medium text-mil-light transition"
            aria-label="Voltar"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-mil-medium transition text-mil-light"
              aria-label="Compartilhar conteudo"
            >
              <Share2 size={22} />
            </button>
            <button
              onClick={handleToggleFavorite}
              className="p-2 -mr-2 rounded-full hover:bg-mil-medium transition"
              aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart
                size={24}
                className={isFav ? 'text-mil-red' : 'text-mil-neutral'}
                fill={isFav ? 'currentColor' : 'none'}
              />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-8">
        {shareFeedback && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm ${
              shareFeedback.tone === 'success'
                ? 'border-mil-gold/40 bg-mil-gold/10 text-mil-light'
                : 'border-mil-red/40 bg-mil-red/10 text-mil-light'
            }`}
          >
            {shareFeedback.message}
          </div>
        )}

        {isSongLayout ? (
        <div className="space-y-6">
          <div className="rounded-xl overflow-hidden border border-mil-medium bg-mil-dark">
            <div className="aspect-video w-full bg-mil-dark">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={item.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-mil-neutral px-4 text-center">
                  Link de vídeo indisponível.
                </div>
              )}
            </div>
          </div>

          <section className="mx-auto w-full max-w-3xl rounded-2xl border border-mil-medium/80 bg-gradient-to-b from-mil-medium/60 via-mil-dark to-mil-dark px-6 py-8">
            <header className="text-center mb-8">
              <h1 className="text-3xl font-heading font-bold italic text-mil-light leading-tight">
                {item.title}
              </h1>
              <p className="mt-3 text-[11px] tracking-[0.2em] uppercase text-mil-neutral font-semibold">
                {songMeta}
              </p>
              {item.description && (
                <p className="mt-4 text-sm text-mil-neutral max-w-xl mx-auto">
                  {item.description}
                </p>
              )}
            </header>

            {hasLyrics ? (
              <div className="space-y-8">
                {lyricsStanzas.map((stanza, stanzaIndex) => (
                  <div key={stanzaIndex} className="space-y-2 text-center">
                    {stanza.map((line, lineIndex) => (
                      <p
                        key={`${stanzaIndex}-${lineIndex}`}
                        className="font-sans italic font-medium text-base md:text-lg leading-relaxed text-mil-light/95"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center italic text-mil-neutral">
                Letra nao disponivel.
              </p>
            )}
          </section>
        </div>
        ) : (
        <>
          <div>
            <div className="inline-block px-2 py-1 bg-mil-medium text-mil-light text-xs font-semibold rounded-md uppercase tracking-wide mb-3">
              {getItemTypeLabel(item.type)}
            </div>
            <h1 className="text-2xl font-heading font-bold text-mil-light leading-tight mb-2">{item.title}</h1>
            {item.description && (
              <p className="text-mil-neutral text-base">{item.description}</p>
            )}
          </div>

          {item.type === 'pdf' ? (
            <>
              {hasFormattedText && (
                <section className="mx-auto w-full max-w-3xl rounded-2xl px-6 py-8 bg-gradient-to-b from-mil-medium/55 via-mil-dark to-mil-dark">
                  <div
                    className="
                      text-mil-light/95
                      [&_p]:text-[1.02rem] [&_p]:leading-8 [&_p]:italic [&_p]:text-justify [&_p]:mb-4
                      [&_h2]:text-mil-red [&_h2]:font-heading [&_h2]:font-bold [&_h2]:text-center [&_h2]:text-2xl [&_h2]:italic [&_h2]:mt-8 [&_h2]:mb-3 [&_h2:first-child]:mt-0
                      [&_strong]:text-mil-light [&_strong]:font-bold
                      [&_b]:text-mil-light [&_b]:font-bold
                      [&_em]:italic [&_i]:italic
                      [&_s]:line-through [&_strike]:line-through
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:my-4
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:my-4
                      [&_li]:text-[1.02rem] [&_li]:leading-8 [&_li]:italic [&_li]:text-justify [&_li]:text-mil-light/95
                    "
                    dangerouslySetInnerHTML={{ __html: sanitizedTextBody }}
                  />
                </section>
              )}

              {pdfExternalUrl && (
                <a
                  href={pdfExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-mil-gold hover:text-mil-light transition font-medium"
                >
                  <ExternalLink size={18} />
                  Ver documento oficial
                </a>
              )}

              {pdfStorageUrl && (
                <div className="bg-mil-light rounded-2xl shadow-sm border border-mil-medium overflow-hidden text-mil-black">
                  <div className="p-6 flex flex-col items-center justify-center text-center">
                    <FileText size={48} className="text-mil-red mb-4" />
                    <h3 className="font-medium text-mil-black mb-1">Documento PDF</h3>
                    <p className="text-sm text-mil-black/70 mb-4">{item.title}</p>
                    <a
                      href={pdfStorageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-mil-medium text-mil-light px-5 py-2.5 rounded-xl font-medium hover:bg-mil-dark transition"
                    >
                      Abrir PDF <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {item.type === 'video' && (
                <div className="rounded-xl overflow-hidden border border-mil-medium bg-mil-dark">
                  <div className="aspect-video w-full bg-mil-dark">
                    {embedUrl ? (
                      <iframe
                        src={embedUrl}
                        title={item.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-mil-neutral px-4 text-center">
                        Link de vídeo indisponível.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {item.type === 'audio' && mediaUrl && (
                <div className="bg-mil-light rounded-2xl shadow-sm border border-mil-medium overflow-hidden text-mil-black">
                  <div className="p-6">
                    <audio controls className="w-full" src={mediaUrl}>
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  </div>
                </div>
              )}

              {shouldRenderTextImageBlock && (
                <section className={`mx-auto w-full max-w-3xl rounded-2xl bg-mil-medium/70 ${textImageBlockPadding}`}>
                  {shouldRenderTopImage && (
                    <div className={`overflow-hidden rounded-xl border border-mil-medium/80 bg-mil-dark/30 ${hasFormattedText ? 'mb-6' : ''}`}>
                      <img
                        src={mediaUrl}
                        alt={item.title}
                        className="w-full h-auto max-h-[420px] object-cover object-center"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {hasFormattedText && (
                    <div
                      className="
                        text-mil-light/95
                        [&_p]:text-[1.02rem] [&_p]:leading-8 [&_p]:italic [&_p]:text-justify [&_p]:mb-4
                        [&_h2]:text-mil-red [&_h2]:font-heading [&_h2]:font-bold [&_h2]:text-center [&_h2]:text-2xl [&_h2]:italic [&_h2]:mt-8 [&_h2]:mb-3 [&_h2:first-child]:mt-0
                        [&_strong]:text-mil-light [&_strong]:font-bold
                        [&_b]:text-mil-light [&_b]:font-bold
                        [&_em]:italic [&_i]:italic
                        [&_s]:line-through [&_strike]:line-through
                        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:my-4
                        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:my-4
                        [&_li]:text-[1.02rem] [&_li]:leading-8 [&_li]:italic [&_li]:text-justify [&_li]:text-mil-light/95
                      "
                      dangerouslySetInnerHTML={{ __html: sanitizedTextBody }}
                    />
                  )}
                </section>
              )}

              {!isTextOrImageItem && hasFormattedText && (
                <section className="mx-auto w-full max-w-3xl rounded-2xl px-6 py-8 bg-gradient-to-b from-mil-medium/55 via-mil-dark to-mil-dark">
                  <div
                    className="
                      text-mil-light/95
                      [&_p]:text-[1.02rem] [&_p]:leading-8 [&_p]:italic [&_p]:text-justify [&_p]:mb-4
                      [&_h2]:text-mil-red [&_h2]:font-heading [&_h2]:font-bold [&_h2]:text-center [&_h2]:text-2xl [&_h2]:italic [&_h2]:mt-8 [&_h2]:mb-3 [&_h2:first-child]:mt-0
                      [&_strong]:text-mil-light [&_strong]:font-bold
                      [&_b]:text-mil-light [&_b]:font-bold
                      [&_em]:italic [&_i]:italic
                      [&_s]:line-through [&_strike]:line-through
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:my-4
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:my-4
                      [&_li]:text-[1.02rem] [&_li]:leading-8 [&_li]:italic [&_li]:text-justify [&_li]:text-mil-light/95
                    "
                    dangerouslySetInnerHTML={{ __html: sanitizedTextBody }}
                  />
                </section>
              )}
            </>
          )}
          </>
        )}

        <div className="pt-6 border-t border-mil-medium">
          <Link
            to={`/suggestion?prefillMessage=Reportando item: ${item.title} (ID: ${item.id})&prefillCategory=Reporte`}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-mil-red/10 text-mil-red rounded-xl font-medium hover:bg-mil-red/20 transition"
          >
            <AlertTriangle size={20} />
            Reportar problema com este conteúdo
          </Link>
        </div>
      </div>
    </div>
  );
}
