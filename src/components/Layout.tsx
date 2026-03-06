import React, { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Search, Heart, MessageSquare, RefreshCw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CatalogSyncState, getCatalogSyncState, subscribeCatalogSync } from '../lib/catalogApi';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const [syncState, setSyncState] = useState<CatalogSyncState>(() => getCatalogSyncState());

  useEffect(() => {
    return subscribeCatalogSync(setSyncState);
  }, []);

  const syncMessage = syncState.isFirstSync
    ? 'Sincronizando dados iniciais...'
    : 'Sincronizando atualizacoes...';

  return (
    <div className="flex flex-col h-screen bg-mil-dark text-mil-light font-sans">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full bg-mil-dark border-t border-mil-medium flex justify-around items-center h-16 px-2 pb-safe z-50">
        <NavItem to="/" icon={<Home size={24} />} label="Home" />
        <NavItem to="/search" icon={<Search size={24} />} label="Busca" />
        <NavItem to="/favorites" icon={<Heart size={24} />} label="Favoritos" />
        <NavItem to="/suggestion" icon={<MessageSquare size={24} />} label="Sugestão" />
      </nav>

      {syncState.inProgress && (
        <div className="fixed inset-0 z-[60] bg-mil-dark/85 flex items-center justify-center px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <RefreshCw size={32} className="animate-spin text-mil-gold" />
            <p className="text-mil-light text-base font-semibold">{syncMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
          isActive ? "text-mil-gold" : "text-mil-neutral hover:text-mil-light"
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
