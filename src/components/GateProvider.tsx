import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getCategoryGateStatus, unlockCategory } from '../lib/gate';
import { trackMonetizationEvent } from '../lib/monetization';

const GATE_COUNTDOWN_SECONDS = 5;

type GateTriggerSource = 'detail' | 'audio';

type GateRequest = {
  categoryId: string;
  source: GateTriggerSource;
  resolve: (allowed: boolean) => void;
};

type GateContextValue = {
  ensureCategoryUnlocked: (categoryId: string, source: GateTriggerSource) => Promise<boolean>;
  isCategoryUnlocked: (categoryId: string) => boolean;
};

type GateProviderProps = {
  children: ReactNode;
};

type AdSenseStatus = 'unconfigured' | 'loading' | 'ready' | 'failed';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const GateContext = createContext<GateContextValue | null>(null);

export default function GateProvider({ children }: GateProviderProps) {
  const adClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || '';
  const adSlot = import.meta.env.VITE_ADSENSE_GATE_SLOT?.trim() || '';
  const isAdConfigured = adClient.length > 0 && adSlot.length > 0;

  const [requestQueue, setRequestQueue] = useState<GateRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<GateRequest | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(GATE_COUNTDOWN_SECONDS);
  const [countdownFinished, setCountdownFinished] = useState(false);
  const [adSenseStatus, setAdSenseStatus] = useState<AdSenseStatus>(
    isAdConfigured ? 'loading' : 'unconfigured',
  );
  const [adRenderFailed, setAdRenderFailed] = useState(false);
  const hasPushedAdRef = useRef(false);

  const isCategoryUnlocked = useCallback((categoryId: string) => {
    const gateCheck = getCategoryGateStatus(categoryId);
    if (gateCheck.expired) {
      trackMonetizationEvent('gate_expired', { categoryId });
    }
    return gateCheck.status.unlocked;
  }, []);

  const ensureCategoryUnlocked = useCallback(
    async (categoryId: string, source: GateTriggerSource): Promise<boolean> => {
      if (!categoryId || isCategoryUnlocked(categoryId)) {
        return true;
      }

      return new Promise((resolve) => {
        setRequestQueue((currentQueue) => [
          ...currentQueue,
          {
            categoryId,
            source,
            resolve,
          },
        ]);
      });
    },
    [isCategoryUnlocked],
  );

  useEffect(() => {
    if (activeRequest || requestQueue.length === 0) return;

    const [nextRequest, ...remainingRequests] = requestQueue;
    setRequestQueue(remainingRequests);

    if (isCategoryUnlocked(nextRequest.categoryId)) {
      nextRequest.resolve(true);
      return;
    }

    setActiveRequest(nextRequest);
    trackMonetizationEvent('gate_opened', {
      categoryId: nextRequest.categoryId,
      source: nextRequest.source,
    });
  }, [activeRequest, isCategoryUnlocked, requestQueue]);

  useEffect(() => {
    if (!activeRequest) return;

    setSecondsLeft(GATE_COUNTDOWN_SECONDS);
    setCountdownFinished(false);
    trackMonetizationEvent('countdown_start', {
      categoryId: activeRequest.categoryId,
      source: activeRequest.source,
    });

    const intervalId = window.setInterval(() => {
      setSecondsLeft((currentValue) => {
        if (currentValue <= 1) {
          window.clearInterval(intervalId);
          setCountdownFinished(true);
          trackMonetizationEvent('countdown_end', {
            categoryId: activeRequest.categoryId,
            source: activeRequest.source,
          });
          return 0;
        }

        return currentValue - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeRequest]);

  useEffect(() => {
    if (!isAdConfigured) {
      setAdSenseStatus('unconfigured');
      return;
    }

    const existingScript =
      document.querySelector<HTMLScriptElement>('#adsense-gate-script') ||
      document.querySelector<HTMLScriptElement>(
        'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
      );

    if (existingScript) {
      if (!existingScript.id) {
        existingScript.id = 'adsense-gate-script';
      }
      setAdSenseStatus('ready');
      return;
    }

    setAdSenseStatus('loading');

    let isCancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!isCancelled) {
        setAdSenseStatus('failed');
      }
    }, 4000);

    const script = document.createElement('script');
    script.id = 'adsense-gate-script';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
    script.onload = () => {
      if (isCancelled) return;
      window.clearTimeout(timeoutId);
      setAdSenseStatus('ready');
    };
    script.onerror = () => {
      if (isCancelled) return;
      window.clearTimeout(timeoutId);
      setAdSenseStatus('failed');
    };
    document.head.appendChild(script);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [adClient, isAdConfigured]);

  useEffect(() => {
    if (!activeRequest) {
      setAdRenderFailed(false);
      hasPushedAdRef.current = false;
      return;
    }

    if (!isAdConfigured || adSenseStatus !== 'ready' || hasPushedAdRef.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      hasPushedAdRef.current = true;
    } catch (error) {
      console.warn('[gate] Failed to render AdSense gate slot.', error);
      setAdRenderFailed(true);
    }
  }, [activeRequest, adSenseStatus, isAdConfigured]);

  const handleDismiss = useCallback(() => {
    setActiveRequest((currentRequest) => {
      if (currentRequest) {
        currentRequest.resolve(false);
      }
      return null;
    });
  }, []);

  const handleUnlock = useCallback(() => {
    if (!countdownFinished) return;

    setActiveRequest((currentRequest) => {
      if (!currentRequest) return null;

      const unlockResult = unlockCategory(currentRequest.categoryId);
      trackMonetizationEvent('gate_unlocked', {
        categoryId: currentRequest.categoryId,
        source: currentRequest.source,
        expiresAt: unlockResult.expiresAt,
      });
      currentRequest.resolve(true);
      return null;
    });
  }, [countdownFinished]);

  const contextValue = useMemo<GateContextValue>(
    () => ({
      ensureCategoryUnlocked,
      isCategoryUnlocked,
    }),
    [ensureCategoryUnlocked, isCategoryUnlocked],
  );

  const shouldRenderAdSlot =
    activeRequest && isAdConfigured && adSenseStatus === 'ready' && !adRenderFailed;

  return (
    <GateContext.Provider value={contextValue}>
      {children}

      {activeRequest && (
        <div className="fixed inset-0 z-[75] bg-black/70 px-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-[#E5C543]/40 bg-[#611515] p-5 text-white shadow-2xl">
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#E5C543]">
              Publicidade
            </p>
            <h2 className="mt-2 text-lg font-heading font-bold text-white">
              Assistir anuncio para liberar
            </h2>
            <p className="mt-2 text-sm text-white/90">
              Apoie o projeto para liberar o conteudo desta categoria por 10 minutos.
            </p>

            <div className="mt-4 rounded-xl border border-[#E5C543]/20 bg-[#491010] p-3 min-h-[132px]">
              {shouldRenderAdSlot ? (
                <ins
                  key={`${activeRequest.categoryId}-${activeRequest.source}`}
                  className="adsbygoogle block min-h-[95px]"
                  data-ad-client={adClient}
                  data-ad-slot={adSlot}
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                />
              ) : (
                <div className="h-full min-h-[95px] flex items-center justify-center text-center text-sm text-white/85">
                  {adSenseStatus === 'loading'
                    ? 'Carregando anuncio...'
                    : 'Modo simulado ativo. Aguarde a contagem para liberar.'}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-[#E5C543] font-semibold">
                {countdownFinished ? 'Conteudo pronto para liberar.' : `Liberacao em ${secondsLeft}s`}
              </span>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs text-white/80 hover:text-white transition"
              >
                Fechar
              </button>
            </div>

            <button
              type="button"
              onClick={handleUnlock}
              disabled={!countdownFinished}
              className="mt-4 w-full rounded-xl bg-[#A21111] px-4 py-3 text-sm font-semibold text-[#FFD700] hover:bg-[#E3BE00] hover:text-[#611515] disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              Liberar conteudo
            </button>
          </div>
        </div>
      )}
    </GateContext.Provider>
  );
}

export function useGate() {
  const context = useContext(GateContext);
  if (!context) {
    throw new Error('useGate must be used within GateProvider.');
  }
  return context;
}
