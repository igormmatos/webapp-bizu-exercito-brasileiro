import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, fetchCatalog } from '../lib/catalogApi';
import { getBizuOfTheDay } from '../lib/bizuOfTheDay';
import { Category, Item } from '../types';
import { BookOpen, RefreshCw, Search as SearchIcon } from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bizu, setBizu] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
      const b = await getBizuOfTheDay();
      setBizu(b);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetchCatalog({ origin: 'manual' });
      await loadData();
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="p-4 flex justify-center text-mil-neutral">Carregando...</div>;
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="bg-mil-dark px-4 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-mil-medium">
        <h1 className="text-2xl font-heading font-bold text-mil-light tracking-tight">Manual de Bolso</h1>
        <div className="flex gap-2">
          <Link to="/search" className="p-2 rounded-full text-mil-light hover:bg-mil-medium transition">
            <SearchIcon size={24} />
          </Link>
          <button 
            onClick={handleSync} 
            disabled={syncing}
            className="p-2 rounded-full text-mil-light hover:bg-mil-medium disabled:opacity-50 transition"
            aria-label="Sincronizar catálogo"
          >
            <RefreshCw size={24} className={syncing ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {bizu && (
          <section>
            <h2 className="font-heading font-semibold text-mil-light text-lg mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-mil-gold rounded-full"></span>
              Bizu do Dia
            </h2>
            <Link to={`/item/${bizu.id}`} className="block bg-mil-medium border border-mil-gold/30 p-4 rounded-lg shadow-sm hover:border-mil-gold transition">
              <h3 className="font-sans font-semibold text-mil-light text-lg mb-1">{bizu.title}</h3>
              <p className="text-mil-neutral text-sm line-clamp-2">{bizu.description || 'Toque para ver os detalhes.'}</p>
            </Link>
          </section>
        )}

        <section>
          <h2 className="font-heading font-semibold text-mil-light text-lg mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-mil-gold rounded-full"></span>
            Categorias
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map(cat => (
              <Link 
                key={cat.id} 
                to={`/category/${cat.id}`}
                className="bg-mil-light p-4 rounded-lg shadow-sm border border-mil-medium flex flex-col items-center text-center hover:border-mil-gold transition"
              >
                <BookOpen size={28} className="text-mil-dark mb-2" />
                <span className="font-sans font-semibold text-mil-black text-sm">{cat.name}</span>
              </Link>
            ))}
            {categories.length === 0 && (
              <div className="col-span-2 text-center text-mil-neutral py-4">
                Nenhuma categoria encontrada. Tente sincronizar.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
