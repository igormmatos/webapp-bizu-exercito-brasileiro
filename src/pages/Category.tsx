import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemsByCategory, getCategories } from '../lib/catalogApi';
import { Item, Category } from '../types';
import { ArrowLeft, File } from 'lucide-react';
import AudioItemCard from '../components/AudioItemCard';
import ItemContentCard from '../components/ItemContentCard';
import { useInlineAudioPlayer } from '../hooks/useInlineAudioPlayer';
import { getItemAudioUrl } from '../lib/audioUrl';
import { getFavorites, toggleFavorite } from '../lib/favoritesCache';
import { trackMonetizationEvent } from '../lib/monetization';
import { useGate } from '../components/GateProvider';
import { useNotice } from '../components/NoticeProvider';

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const { activeId, isPlaying, isLoopEnabled, toggleLoop, togglePlay } = useInlineAudioPlayer();
  const { ensureCategoryUnlocked } = useGate();
  const { showNotice } = useNotice();

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (categoryId: string) => {
    setLoading(true);
    const cats = await getCategories();
    const cat = cats.find(c => c.id === categoryId);
    setCategory(cat || null);

    const catItems = await getItemsByCategory(categoryId);
    const favoriteList = await getFavorites();
    setItems(catItems);
    setFavoriteIds(new Set(favoriteList));
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
      <header className="bg-mil-dark px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-mil-medium">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-mil-medium text-mil-light transition"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-heading font-bold text-mil-light tracking-tight">
          {category ? category.name : 'Categoria'}
        </h1>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <p className="text-mil-neutral text-center py-8">Carregando itens...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-mil-light rounded-lg border border-mil-medium shadow-sm">
            <File size={48} className="mx-auto text-mil-neutral mb-4" />
            <h2 className="text-lg font-heading font-semibold text-mil-black mb-2">Nenhum item</h2>
            <p className="text-mil-black/70 text-sm max-w-[250px] mx-auto">
              Esta categoria ainda não possui conteúdo publicado.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
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
        )}
      </div>
    </div>
  );
}
