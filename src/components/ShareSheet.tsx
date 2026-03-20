import { useEffect } from 'react';
import { Copy, MessageCircle, Share2, X } from 'lucide-react';
import type { ItemSharePayload } from '../lib/share';

type ShareSheetProps = {
  isOpen: boolean;
  payload: ItemSharePayload | null;
  showNativeShare: boolean;
  onClose: () => void;
  onCopy: () => void;
  onNativeShare: () => void;
};

export default function ShareSheet({
  isOpen,
  payload,
  showNativeShare,
  onClose,
  onCopy,
  onNativeShare,
}: ShareSheetProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscClose = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscClose);
    return () => window.removeEventListener('keydown', handleEscClose);
  }, [isOpen, onClose]);

  if (!isOpen || !payload) return null;

  return (
    <div className="fixed inset-0 z-[56] bg-black/60 flex items-end justify-center p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compartilhar conteúdo"
        className="w-full max-w-md rounded-3xl border border-mil-medium bg-mil-dark px-5 py-5 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-mil-light">Compartilhar conteúdo</h2>
            <p className="mt-1 text-sm text-mil-light/75">
              Escolha como deseja enviar este conteúdo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-mil-neutral transition hover:bg-mil-medium hover:text-mil-light"
            aria-label="Fechar compartilhamento"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl border border-mil-medium bg-mil-medium/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mil-neutral">
            Prévia da mensagem
          </p>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-mil-light/95">
            {payload.message}
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <a
            href={payload.whatsappUrl}
            onClick={onClose}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-4 py-3.5 text-sm font-bold text-[#10331d] transition hover:brightness-95"
          >
            <MessageCircle size={18} />
            Compartilhar no WhatsApp
          </a>

          <button
            type="button"
            onClick={onCopy}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-mil-medium bg-mil-light px-4 py-3.5 text-sm font-semibold text-mil-black transition hover:border-mil-gold"
          >
            <Copy size={18} />
            Copiar mensagem
          </button>

          {showNativeShare && (
            <button
              type="button"
              onClick={onNativeShare}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-mil-medium px-4 py-3.5 text-sm font-semibold text-mil-light transition hover:bg-mil-medium"
            >
              <Share2 size={18} />
              Mais opções
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
