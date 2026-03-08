import { useState, useEffect } from 'react';
import { getFavorites, toggleFavorite } from '../lib/favoritesCache';
import { getItemById } from '../lib/catalogApi';
import { Item } from '../types';
import { Heart } from 'lucide-react';
import AudioItemCard from '../components/AudioItemCard';
import ItemContentCard from '../components/ItemContentCard';
import { useInlineAudioPlayer } from '../hooks/useInlineAudioPlayer';
import { getItemAudioUrl } from '../lib/audioUrl';
import { useGate } from '../components/GateProvider';

export default function Favorites() {
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeId, isPlaying, isLoopEnabled, toggleLoop, togglePlay } = useInlineAudioPlayer();
  const { ensureCategoryUnlocked } = useGate();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    const favIds = await getFavorites();
    const items: Item[] = [];
    for (const id of favIds) {
      const item = await getItemById(id);
      if (item) items.push(item);
    }
    setFavorites(items);
    setLoading(false);
  };

  const handleToggleFavorite = async (item: Item) => {
    const result = await toggleFavorite(item.id, item.category_id);
    if (result.status === 'removed') {
      setFavorites((currentValue) => currentValue.filter((favoriteItem) => favoriteItem.id !== item.id));
    }
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
        <h1 className="text-2xl font-heading font-bold text-mil-light tracking-tight flex items-center gap-2">
          <Heart className="text-mil-gold" fill="currentColor" /> Favoritos
        </h1>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <p className="text-mil-neutral text-center py-8">Carregando favoritos...</p>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 bg-mil-light rounded-lg border border-mil-medium shadow-sm">
            <Heart size={48} className="mx-auto text-mil-neutral mb-4" />
            <h2 className="text-lg font-heading font-semibold text-mil-black mb-2">Nenhum favorito</h2>
            <p className="text-mil-black/70 text-sm max-w-[250px] mx-auto">
              Você ainda não adicionou nenhum conteúdo aos seus favoritos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map(item => {
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
                      isFavorite={true}
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
                    isFavorite={true}
                    onToggleFavorite={() => handleToggleFavorite(item)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
