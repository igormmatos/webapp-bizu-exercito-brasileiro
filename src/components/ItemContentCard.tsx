import { Link } from 'react-router-dom';
import {
  File,
  FileText,
  Headphones,
  Heart,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { Item } from '../types';
import { getItemTypeLabel } from '../lib/itemTypeLabel';

type ItemContentCardProps = {
  item: Item;
  to: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  tone?: 'light' | 'dark';
  fallbackDescription?: string;
};

function getTypeIcon(type: string, tone: 'light' | 'dark') {
  const isDark = tone === 'dark';

  switch (type) {
    case 'pdf':
      return <FileText size={20} className={isDark ? 'text-mil-red' : 'text-mil-red'} />;
    case 'video':
      return <Video size={20} className={isDark ? 'text-mil-blue' : 'text-mil-blue'} />;
    case 'audio':
      return <Headphones size={20} className={isDark ? 'text-mil-gold' : 'text-mil-gold'} />;
    case 'image':
      return <ImageIcon size={20} className={isDark ? 'text-mil-gold' : 'text-mil-gold'} />;
    default:
      return <File size={20} className={isDark ? 'text-mil-neutral' : 'text-mil-neutral'} />;
  }
}

export default function ItemContentCard({
  item,
  to,
  isFavorite,
  onToggleFavorite,
  tone = 'light',
  fallbackDescription,
}: ItemContentCardProps) {
  const isDark = tone === 'dark';
  const description = item.description?.trim() || fallbackDescription;

  const cardClassName = isDark
    ? 'bg-mil-medium border-mil-gold/30 hover:border-mil-gold'
    : 'bg-mil-light border-mil-medium hover:border-mil-gold';

  const titleClassName = isDark ? 'text-mil-light' : 'text-mil-black';
  const descriptionClassName = isDark ? 'text-mil-neutral' : 'text-mil-black/70';
  const badgeClassName = isDark
    ? 'bg-mil-light/10 text-mil-light'
    : 'bg-mil-neutral/20 text-mil-black';
  const favoriteClassName = isFavorite
    ? 'text-mil-red bg-mil-red/15'
    : isDark
      ? 'text-mil-neutral hover:text-mil-light hover:bg-mil-light/10'
      : 'text-mil-neutral hover:text-mil-black hover:bg-mil-dark/5';

  return (
    <article
      className={`flex items-start gap-3 min-w-0 overflow-hidden p-3 rounded-lg shadow-sm border transition ${cardClassName}`}
    >
      <Link to={to} className="flex items-start min-w-0 flex-1">
        <div className="mr-3 mt-1 shrink-0">
          {getTypeIcon(item.type, tone)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className={`font-sans font-semibold line-clamp-2 leading-snug break-words ${titleClassName}`}>
            {item.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider ${badgeClassName}`}>
              {getItemTypeLabel(item.type)}
            </span>
          </div>

          {description && (
            <p className={`text-sm line-clamp-2 break-words mt-1 ${descriptionClassName}`}>
              {description}
            </p>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={onToggleFavorite}
        className={`h-9 w-9 rounded-full shrink-0 flex items-center justify-center transition ${favoriteClassName}`}
        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}
