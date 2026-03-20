import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Headphones, Heart, Pause, Play, Repeat } from 'lucide-react';
import { Item } from '../types';

type AudioItemCardProps = {
  item: Item;
  canPlay: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  showProgress: boolean;
  isLooping: boolean;
  isFavorite: boolean;
  currentTime: number;
  duration: number;
  onSeek: (fraction: number) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onToggleFavorite: () => void;
};

export default function AudioItemCard({
  item,
  canPlay,
  isPlaying,
  isLoading,
  showProgress,
  isLooping,
  isFavorite,
  currentTime,
  duration,
  onSeek,
  onTogglePlay,
  onToggleLoop,
  onToggleFavorite,
}: AudioItemCardProps) {
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const hasDescription = Boolean(item.description && item.description.trim().length > 0);
  const shouldShowTitleToggle = item.title.trim().length > 70;
  const hasDuration = Number.isFinite(duration) && duration > 0;
  const progressPercent = hasDuration ? Math.min((currentTime / duration) * 100, 100) : 0;

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const wholeSeconds = Math.floor(seconds);
    const minutes = Math.floor(wholeSeconds / 60);
    const remainingSeconds = wholeSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCardClick = () => {
    if (!canPlay) return;
    onTogglePlay();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!canPlay) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTogglePlay();
    }
  };

  const updateSeekPosition = (clientX: number) => {
    if (!progressBarRef.current || !hasDuration || isLoading) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;

    const fraction = (clientX - rect.left) / rect.width;
    onSeek(fraction);
  };

  const handleProgressPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!hasDuration || isLoading) return;

    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    updateSeekPosition(event.clientX);
  };

  const handleProgressPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateSeekPosition(event.clientX);
  };

  const handleProgressPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    updateSeekPosition(event.clientX);
  };

  return (
    <article
      role="button"
      tabIndex={canPlay ? 0 : -1}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className="p-3 bg-mil-light rounded-lg shadow-sm border border-mil-medium transition hover:border-mil-gold focus:outline-none focus:ring-2 focus:ring-mil-gold"
      aria-label={`${isPlaying ? 'Pausar' : 'Reproduzir'} ${item.title}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="mt-1">
            <Headphones size={20} className="text-mil-gold" />
          </div>
          <div className="min-w-0">
            <h3
              className={`font-sans font-semibold text-mil-black break-words ${
                isTitleExpanded ? 'whitespace-normal' : 'line-clamp-2 leading-snug'
              }`}
            >
              {item.title}
            </h3>
            {shouldShowTitleToggle && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsTitleExpanded((currentValue) => !currentValue);
                }}
                className="mt-1 text-[11px] font-semibold text-mil-blue hover:text-mil-dark transition"
                aria-label={isTitleExpanded ? 'Mostrar menos título' : 'Mostrar título completo'}
              >
                {isTitleExpanded ? 'Ver menos' : 'Ver mais'}
              </button>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-medium px-1.5 py-0.5 bg-mil-neutral/20 text-mil-black rounded uppercase tracking-wider">
                ÁUDIO
              </span>
            </div>
            {hasDescription && (
              <p className="text-xs text-mil-black/70 line-clamp-1 break-words mt-1">
                {item.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite();
            }}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition ${
              isFavorite
                ? 'text-mil-red bg-mil-red/10'
                : 'text-mil-neutral hover:text-mil-black hover:bg-mil-dark/5'
            }`}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleLoop();
            }}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition ${
              isLooping
                ? 'text-mil-gold bg-mil-dark/10'
                : 'text-mil-neutral hover:text-mil-black hover:bg-mil-dark/5'
            }`}
            aria-label={isLooping ? 'Desativar repetição' : 'Ativar repetição'}
          >
            <Repeat size={17} />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onTogglePlay();
            }}
            disabled={!canPlay}
            className="h-11 w-11 rounded-full flex items-center justify-center bg-mil-dark text-mil-light hover:bg-mil-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
        </div>
      </div>

      {showProgress && (
        <div className="mt-4 border-t border-mil-medium/80 pt-3">
          {isLoading ? (
            <div className="flex items-center justify-between gap-3 text-xs font-medium text-mil-black/70">
              <span>Carregando...</span>
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-mil-neutral/20">
                <span className="block h-full w-1/2 animate-pulse rounded-full bg-mil-gold/80" />
              </span>
            </div>
          ) : hasDuration ? (
            <div className="space-y-2">
              <div
                ref={progressBarRef}
                role="slider"
                aria-label="Ajustar posição do áudio"
                aria-valuemin={0}
                aria-valuemax={Math.max(duration, 0)}
                aria-valuenow={Math.min(currentTime, duration)}
                tabIndex={0}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={handleProgressPointerDown}
                onPointerMove={handleProgressPointerMove}
                onPointerUp={handleProgressPointerUp}
                onPointerCancel={handleProgressPointerUp}
                className="relative h-4 w-full cursor-pointer touch-none"
              >
                <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-mil-neutral/20">
                  <div
                    className="h-full rounded-full bg-mil-gold transition-[width] duration-200 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-mil-dark/20 bg-mil-gold shadow-sm transition-[left] duration-200 ease-out"
                  style={{ left: `calc(${progressPercent}% - 0.4375rem)` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-mil-black/70">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] font-medium text-mil-black/60">
              <span>Preparando áudio...</span>
              <span>0:00</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
