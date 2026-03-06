import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchItems } from '../lib/searchIndex';
import { Item } from '../types';
import { Search as SearchIcon, FileText, Video, Headphones, File } from 'lucide-react';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

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
        {!loading && results.map(item => (
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
    </div>
  );
}
