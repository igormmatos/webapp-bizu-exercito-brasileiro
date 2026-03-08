import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchItems } from '../lib/searchIndex';
import { Item } from '../types';
import { Search as SearchIcon } from 'lucide-react';
import AudioItemCard from '../components/AudioItemCard';
import ItemContentCard from '../components/ItemContentCard';
import { useInlineAudioPlayer } from '../hooks/useInlineAudioPlayer';
import { getItemAudioUrl } from '../lib/audioUrl';
import { getFavorites, toggleFavorite } from '../lib/favoritesCache';
import { trackMonetizationEvent } from '../lib/monetization';
import { useGate } from '../components/GateProvider';
import { useNotice } from '../components/NoticeProvider';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const { activeId, isPlaying, isLoopEnabled, toggleLoop, togglePlay } = useInlineAudioPlayer();
  const { ensureCategoryUnlocked } = useGate();
  const { showNotice } = useNotice();

  useEffect(() => {
    getFavorites().then((favoriteList) => {
      setFavoriteIds(new Set(favoriteList));
    });
  }, []);

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async (q: string) => {
    setLoading(true);
    const res = await searchItems(q);
    setResults(res);
    setLoading(false);
  };

  const handleToggleFavorite = async (item: Item) => {
    const result = await toggleFavorite(item.id, item.category_id);
    if (result.status === 'limit_reached') {
      showNotice({
        variant: 'warning',
        message: '⚠️ Você atingiu o limite de 3 favoritos por categoria — mantenha apenas os essenciais.',
      });
      trackMonetizationEvent('favoritos_limit_reached', {
        itemId: item.id,
        categoryId: item.category_id,
      });
      return;
    }

    setFavoriteIds((currentValue) => {
      const nextValue = new Set(currentValue);
      if (result.status === 'added') {
        nextValue.add(item.id);
      } else {
        nextValue.delete(item.id);
      }
      return nextValue;
    });
  };

  const handleToggleAudioPlay = async (item: Item, audioUrl: string) => {
    if (!audioUrl) return;
    const isCurrentTrackPlaying = activeId === item.id && isPlaying;
    if (isCurrentTrackPlaying) {
      togglePlay(item.id, audioUrl);
      return;
    }

    const canPlay = await ensureCategoryUnlocked(item.category_id, 'audio');
    if (!canPlay) return;
    togglePlay(item.id, audioUrl);
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="bg-mil-dark px-4 py-4 sticky top-0 z-10 border-b border-mil-medium">
        <h1 className="text-2xl font-heading font-bold text-mil-light tracking-tight mb-4">Busca</h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon size={20} className="text-mil-neutral" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-mil-medium rounded-lg leading-5 bg-mil-light text-mil-black placeholder-mil-neutral focus:outline-none focus:ring-2 focus:ring-mil-gold sm:text-sm"
            placeholder="Buscar conteúdo..."
            value={query}
            onChange={(e) => setSearchParams({ q: e.target.value })}
          />
        </div>
      </header>

      <div className="p-4 space-y-3">
        {loading && <p className="text-mil-neutral text-center">Buscando...</p>}
        {!loading && query && results.length === 0 && (
          <p className="text-mil-neutral text-center">Nenhum resultado encontrado para "{query}".</p>
        )}
        {!loading && results.map(item => {
          if (item.type === 'audio') {
            const audioUrl = getItemAudioUrl(item);
            const isItemPlaying = activeId === item.id && isPlaying;
            return (
              <div key={item.id}>
                <AudioItemCard
                  item={item}
                  canPlay={Boolean(audioUrl)}
                  isPlaying={isItemPlaying}
                  isLooping={isLoopEnabled(item.id)}
                  isFavorite={favoriteIds.has(item.id)}
                  onTogglePlay={() => handleToggleAudioPlay(item, audioUrl)}
                  onToggleLoop={() => toggleLoop(item.id)}
                  onToggleFavorite={() => handleToggleFavorite(item)}
                />
              </div>
            );
          }

          return (
            <div key={item.id}>
              <ItemContentCard
                item={item}
                to={`/item/${item.id}`}
                isFavorite={favoriteIds.has(item.id)}
                onToggleFavorite={() => handleToggleFavorite(item)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
