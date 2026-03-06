import type { KeyboardEvent } from 'react';
import { Headphones, Pause, Play, Repeat } from 'lucide-react';
import { Item } from '../types';

type AudioItemCardProps = {
  item: Item;
  canPlay: boolean;
  isPlaying: boolean;
  isLooping: boolean;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
};

export default function AudioItemCard({
  item,
  canPlay,
  isPlaying,
  isLooping,
  onTogglePlay,
  onToggleLoop,
}: AudioItemCardProps) {
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
            <h3 className="font-sans font-semibold text-mil-black truncate">{item.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-medium px-1.5 py-0.5 bg-mil-neutral/20 text-mil-black rounded uppercase tracking-wider">
                AUDIO
              </span>
            </div>
            {item.description && (
              <p className="text-xs text-mil-black/70 line-clamp-1 mt-1">{item.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
    </article>
  );
}
