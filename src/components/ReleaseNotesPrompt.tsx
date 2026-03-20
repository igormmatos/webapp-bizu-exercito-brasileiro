import { useEffect, useState } from 'react';
import { Megaphone, Sparkles } from 'lucide-react';
import {
  getReleaseNotesForVersion,
  markCurrentReleaseNotesAsSeen,
  shouldShowCurrentReleaseNotes,
  type ReleaseNotesEntry,
} from '../lib/releaseNotes';

type ReleaseNotesPromptProps = {
  blocked?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
};

export default function ReleaseNotesPrompt({
  blocked = false,
  onVisibilityChange,
}: ReleaseNotesPromptProps) {
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNotesEntry | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (blocked || isOpen) return;
    if (!shouldShowCurrentReleaseNotes(__APP_VERSION__)) return;

    const currentReleaseNotes = getReleaseNotesForVersion(__APP_VERSION__);
    if (!currentReleaseNotes) return;

    setReleaseNotes(currentReleaseNotes);
    setIsOpen(true);
  }, [blocked, isOpen]);

  useEffect(() => {
    onVisibilityChange?.(isOpen);
  }, [isOpen, onVisibilityChange]);

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
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscClose);
    return () => window.removeEventListener('keydown', handleEscClose);
  }, [isOpen, releaseNotes]);

  const handleClose = () => {
    markCurrentReleaseNotesAsSeen(__APP_VERSION__);
    setIsOpen(false);
  };

  if (!isOpen || !releaseNotes) return null;

  return (
    <div className="fixed inset-0 z-[58] bg-black/60 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Novidades da versao"
        className="w-full max-w-md rounded-2xl border border-mil-medium bg-mil-dark px-5 py-6 shadow-2xl"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mil-gold/15 text-mil-gold">
          <Megaphone size={24} />
        </div>

        <h2 className="text-center text-2xl font-heading font-bold text-mil-red">
          {releaseNotes.title}
        </h2>
        <p className="mt-2 text-center text-sm text-mil-light/90">
          Versao {__APP_VERSION__}
          {releaseNotes.publishedAt ? ` · ${releaseNotes.publishedAt}` : ''}
        </p>

        <div className="mt-5 space-y-3">
          {releaseNotes.items.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mil-red text-xs font-bold text-mil-light">
                <Sparkles size={14} />
              </span>
              <p className="text-sm leading-6 text-mil-light/95">{item}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="mt-6 w-full rounded-xl bg-mil-gold px-4 py-3 text-sm font-bold text-mil-black hover:brightness-95 transition"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
