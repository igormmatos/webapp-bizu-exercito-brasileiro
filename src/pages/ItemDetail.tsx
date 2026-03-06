import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getItemById } from '../lib/catalogApi';
import { isFavorite, toggleFavorite } from '../lib/favoritesCache';
import { Item } from '../types';
import { ArrowLeft, Heart, AlertTriangle, ExternalLink, FileText, Video, Headphones, File } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DOMPurify from 'dompurify';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (itemId: string) => {
    setLoading(true);
    const data = await getItemById(itemId);
    setItem(data || null);
    if (data) {
      const fav = await isFavorite(itemId);
      setIsFav(fav);
    }
    setLoading(false);
  };

  const handleToggleFavorite = async () => {
    if (!id) return;
    const newStatus = await toggleFavorite(id);
    setIsFav(newStatus);
  };

  const getPublicUrl = (path?: string) => {
    if (!path) return '';
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return <div className="p-4 flex justify-center py-12 text-slate-500">Carregando...</div>;
  }

  if (!item) {
    return (
      <div className="p-4 text-center py-12">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Item não encontrado</h2>
        <button onClick={() => navigate(-1)} className="text-indigo-600 font-medium">Voltar</button>
      </div>
    );
  }

  const mediaUrl = item.storage_path ? getPublicUrl(item.storage_path) : item.link;

  return (
    <div className="p-4 space-y-6 pb-8">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-700 transition"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
        <button 
          onClick={handleToggleFavorite}
          className="p-2 -mr-2 rounded-full hover:bg-slate-200 transition"
          aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Heart size={24} className={isFav ? "text-rose-500" : "text-slate-400"} fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>

      <div>
        <div className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-md uppercase tracking-wide mb-3">
          {item.type}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{item.title}</h1>
        {item.description && (
          <p className="text-slate-600 text-base">{item.description}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {item.type === 'video' && item.link && (
          <div className="aspect-video w-full bg-slate-900">
            <iframe 
              src={item.link.replace('watch?v=', 'embed/')} 
              title={item.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        )}

        {item.type === 'audio' && mediaUrl && (
          <div className="p-6 bg-slate-50">
            <audio controls className="w-full" src={mediaUrl}>
              Seu navegador não suporta o elemento de áudio.
            </audio>
          </div>
        )}

        {item.type === 'pdf' && mediaUrl && (
          <div className="p-6 flex flex-col items-center justify-center text-center bg-slate-50 border-b border-slate-100">
            <FileText size={48} className="text-red-500 mb-4" />
            <h3 className="font-medium text-slate-900 mb-2">Documento PDF</h3>
            <a 
              href={mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition"
            >
              Abrir PDF <ExternalLink size={18} />
            </a>
          </div>
        )}

        {item.text_body && (
          <div className="p-6 prose prose-slate prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.text_body) }} />
        )}
      </div>

      <div className="pt-6 border-t border-slate-200">
        <Link 
          to={`/suggestion?prefillMessage=Reportando item: ${item.title} (ID: ${item.id})&prefillCategory=Reporte`}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition"
        >
          <AlertTriangle size={20} />
          Reportar problema com este conteúdo
        </Link>
      </div>
    </div>
  );
}
