import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFavorites } from '../lib/favoritesCache';
import { getItemById } from '../lib/catalogApi';
import { Item } from '../types';
import { Heart, FileText, Video, Headphones, File } from 'lucide-react';

export default function Favorites() {
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={20} className="text-mil-red" />;
      case 'video': return <Video size={20} className="text-mil-blue" />;
      case 'audio': return <Headphones size={20} className="text-mil-gold" />;
      default: return <File size={20} className="text-mil-neutral" />;
    }
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
            {favorites.map(item => (
              <Link 
                key={item.id} 
                to={`/item/${item.id}`}
                className="flex items-start p-3 bg-mil-light rounded-lg shadow-sm border border-mil-medium hover:border-mil-gold transition"
              >
                <div className="mr-3 mt-1">
                  {getIcon(item.type)}
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-mil-black">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 bg-mil-neutral/20 text-mil-black rounded uppercase tracking-wider">
                      {item.type}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-mil-black/70 line-clamp-2 mt-1">{item.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
