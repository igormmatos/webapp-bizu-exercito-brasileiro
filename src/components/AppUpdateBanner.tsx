import { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import {
  applyPwaUpdate,
  dismissPwaUpdateBanner,
  getPwaUpdateState,
  subscribePwaUpdate,
  type PwaUpdateState,
} from '../lib/pwaUpdate';

type AppUpdateBannerProps = {
  blocked?: boolean;
};

export default function AppUpdateBanner({ blocked = false }: AppUpdateBannerProps) {
  const [updateState, setUpdateState] = useState<PwaUpdateState>(() => getPwaUpdateState());

  useEffect(() => {
    return subscribePwaUpdate(setUpdateState);
  }, []);

  const shouldShowBanner =
    !blocked && updateState.needRefresh && !updateState.bannerDismissed;

  if (!shouldShowBanner) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-[52]">
      <div className="mx-auto flex w-full max-w-xl items-start gap-3 rounded-2xl border border-mil-gold/30 bg-mil-dark px-4 py-4 shadow-2xl">
        <div className="mt-0.5 rounded-full bg-mil-gold/15 p-2 text-mil-gold">
          <Download size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-mil-light">Nova versao disponivel</h2>
          <p className="mt-1 text-sm leading-6 text-mil-light/85">
            Atualize agora para carregar a versao mais recente do app.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void applyPwaUpdate();
              }}
              disabled={updateState.updateInProgress}
              className="inline-flex items-center gap-2 rounded-xl bg-mil-gold px-4 py-2.5 text-sm font-bold text-mil-black hover:brightness-95 disabled:opacity-70 transition"
            >
              <RefreshCw size={16} className={updateState.updateInProgress ? 'animate-spin' : ''} />
              {updateState.updateInProgress ? 'Atualizando...' : 'Atualizar agora'}
            </button>

            <button
              type="button"
              onClick={dismissPwaUpdateBanner}
              disabled={updateState.updateInProgress}
              className="rounded-xl border border-mil-medium px-4 py-2.5 text-sm font-semibold text-mil-light hover:bg-mil-medium disabled:opacity-70 transition"
            >
              Depois
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={dismissPwaUpdateBanner}
          disabled={updateState.updateInProgress}
          className="rounded-full p-1.5 text-mil-neutral hover:bg-mil-medium hover:text-mil-light disabled:opacity-70 transition"
          aria-label="Fechar aviso de atualizacao"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
