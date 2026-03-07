import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getItemsByCategory, getCategories } from '../lib/catalogApi';
import { Item, Category } from '../types';
import { ArrowLeft, FileText, Video, Headphones, Image as ImageIcon, File } from 'lucide-react';
import AudioItemCard from '../components/AudioItemCard';
import { useInlineAudioPlayer } from '../hooks/useInlineAudioPlayer';
import { getItemAudioUrl } from '../lib/audioUrl';
import { getItemTypeLabel } from '../lib/itemTypeLabel';
import { getFavorites, toggleFavorite } from '../lib/favoritesCache';

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const { activeId, isPlaying, isLoopEnabled, toggleLoop, togglePlay } = useInlineAudioPlayer();

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

  const handleToggleFavorite = async (itemId: string) => {
    const newStatus = await toggleFavorite(itemId);
    setFavoriteIds((currentValue) => {
      const nextValue = new Set(currentValue);
      if (newStatus) {
        nextValue.add(itemId);
      } else {
        nextValue.delete(itemId);
      }
      return nextValue;
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={20} className="text-mil-red" />;
      case 'video': return <Video size={20} className="text-mil-blue" />;
      case 'audio': return <Headphones size={20} className="text-mil-gold" />;
      case 'image': return <ImageIcon size={20} className="text-mil-gold" />;
      default: return <File size={20} className="text-mil-neutral" />;
    }
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
                      onTogglePlay={() => togglePlay(item.id, audioUrl)}
                      onToggleLoop={() => toggleLoop(item.id)}
                      onToggleFavorite={() => handleToggleFavorite(item.id)}
                    />
                  </div>
                );
              }

              return (
                <Link 
                  key={item.id} 
                  to={`/item/${item.id}`}
                  className="flex items-start min-w-0 overflow-hidden p-3 bg-mil-light rounded-lg shadow-sm border border-mil-medium hover:border-mil-gold transition"
                >
                  <div className="mr-3 mt-1 shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-sans font-semibold text-mil-black line-clamp-2 leading-snug break-words">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-mil-neutral/20 text-mil-black rounded uppercase tracking-wider">
                        {getItemTypeLabel(item.type)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-mil-black/70 line-clamp-2 break-words mt-1">{item.description}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
