import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submitSuggestion } from '../lib/suggestionsApi';
import { MessageSquare, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Suggestion() {
  const [searchParams] = useSearchParams();
  const prefillMessage = searchParams.get('prefillMessage') || '';
  const prefillCategory = searchParams.get('prefillCategory') || '';

  const [message, setMessage] = useState(prefillMessage);
  const [category, setCategory] = useState(prefillCategory);
  const [contact, setContact] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setLoading(true);
    setStatus('idle');
    
    const result = await submitSuggestion({
      message,
      category: category || undefined,
      contact: contact || undefined,
      app_version: `${__APP_VERSION__} (PWA)`,
      device: navigator.userAgent
    });

    if (result.success) {
      setStatus('success');
      setMessage('');
      setCategory('');
      setContact('');
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Erro desconhecido');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="bg-mil-dark px-4 py-4 sticky top-0 z-10 border-b border-mil-medium">
        <h1 className="text-2xl font-heading font-bold text-mil-light tracking-tight flex items-center gap-2">
          <MessageSquare className="text-mil-gold" /> Sugestão
        </h1>
      </header>

      <div className="p-4 space-y-6 max-w-md mx-auto w-full">
        <p className="text-mil-light/80 text-sm">
          Envie sugestões, correções ou reporte problemas anonimamente.
        </p>

        {status === 'success' && (
          <div className="bg-mil-light text-mil-black p-4 rounded-lg flex items-start gap-3 border-l-4 border-mil-gold">
            <CheckCircle2 className="text-mil-gold shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-sans font-semibold">Sugestão enviada!</h3>
              <p className="text-sm mt-1 opacity-90">Obrigado pela sua colaboração. Analisaremos em breve.</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-mil-light text-mil-black p-4 rounded-lg flex items-start gap-3 border-l-4 border-mil-red">
            <AlertCircle className="text-mil-red shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-sans font-semibold">Erro ao enviar</h3>
              <p className="text-sm mt-1 opacity-90">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-mil-light mb-1">
              Mensagem <span className="text-mil-red">*</span>
            </label>
            <textarea
              id="message"
              rows={5}
              maxLength={2000}
              required
              className="w-full p-3 border border-mil-medium rounded-lg focus:ring-2 focus:ring-mil-gold focus:border-mil-gold bg-mil-light text-mil-black"
              placeholder="Descreva sua sugestão ou problema..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="text-right text-xs text-mil-neutral mt-1">
              {message.length}/2000
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-mil-light mb-1">
              Categoria (Opcional)
            </label>
            <input
              type="text"
              id="category"
              className="w-full p-3 border border-mil-medium rounded-lg focus:ring-2 focus:ring-mil-gold focus:border-mil-gold bg-mil-light text-mil-black"
              placeholder="Ex: Correção, Novo Conteúdo, Erro"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-mil-light mb-1">
              Contato (Opcional)
            </label>
            <input
              type="text"
              id="contact"
              className="w-full p-3 border border-mil-medium rounded-lg focus:ring-2 focus:ring-mil-gold focus:border-mil-gold bg-mil-light text-mil-black"
              placeholder="Email ou telefone para retorno"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full flex items-center justify-center gap-2 bg-mil-gold text-mil-dark py-3.5 px-4 rounded-lg font-sans font-semibold hover:bg-mil-gold/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mil-gold focus:ring-offset-mil-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Enviando...' : (
              <>
                <Send size={20} />
                ENVIAR SUGESTÃO
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
