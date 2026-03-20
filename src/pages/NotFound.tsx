import { Link } from 'react-router-dom';
import { Home, Link2Off } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="bg-mil-dark px-4 py-4 sticky top-0 z-10 border-b border-mil-medium">
        <h1 className="text-2xl font-heading font-bold text-mil-light tracking-tight">Link invalido</h1>
      </header>

      <div className="flex-1 px-4 py-10 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-mil-medium bg-mil-light text-mil-black p-6 text-center shadow-sm">
          <Link2Off size={40} className="mx-auto text-mil-red mb-4" />
          <h2 className="text-xl font-heading font-bold mb-2">Pagina nao encontrada</h2>
          <p className="text-sm text-mil-black/70 mb-6">
            O link acessado esta incompleto, malformado ou nao corresponde a um destino valido do app.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-mil-dark px-5 py-3 text-sm font-semibold text-mil-light hover:bg-mil-medium transition"
          >
            <Home size={18} />
            Ir para a Home
          </Link>
        </div>
      </div>
    </div>
  );
}
