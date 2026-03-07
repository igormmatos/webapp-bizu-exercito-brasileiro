import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, EllipsisVertical, Globe, Plus, PlusSquare, Share2 } from 'lucide-react';

type PlatformTab = 'iphone' | 'android';

type PwaInstallPromptProps = {
  blocked?: boolean;
};

const PROMPT_STORAGE_KEY = 'pwa_install_prompt_seen_v1';
const PROMPT_DELAY_MS = 1500;
const APP_ICON_URL =
  'https://obsnofjxkewjjtxstkpa.supabase.co/storage/v1/object/public/content/src/icon_white.png';

function detectPreferredTab(): PlatformTab {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'iphone';
  return 'android';
}

function isMobileOrTablet(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const uaMobile = /android|iphone|ipad|ipod|mobile|tablet/.test(ua);
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrowViewport = window.matchMedia?.('(max-width: 1024px)').matches ?? false;
  return uaMobile || (coarsePointer && narrowViewport);
}

function isStandalone(): boolean {
  const standaloneByMedia = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const standaloneByNavigator = Boolean(navigator.standalone);
  return standaloneByMedia || standaloneByNavigator;
}

export default function PwaInstallPrompt({ blocked = false }: PwaInstallPromptProps) {
  const [activeTab, setActiveTab] = useState<PlatformTab>('iphone');
  const [isEligible, setIsEligible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const markAsSeen = useCallback(() => {
    try {
      window.localStorage.setItem(PROMPT_STORAGE_KEY, '1');
    } catch {
      // Ignore localStorage write failures.
    }
    setIsEligible(false);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    setActiveTab(detectPreferredTab());

    let hasSeen = false;
    try {
      hasSeen = window.localStorage.getItem(PROMPT_STORAGE_KEY) === '1';
    } catch {
      // Ignore localStorage read failures.
    }

    const eligible = !hasSeen && isMobileOrTablet() && !isStandalone();
    setIsEligible(eligible);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
      if (detectPreferredTab() === 'android') {
        setActiveTab('android');
      }
    };

    const handleAppInstalled = () => {
      markAsSeen();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [markAsSeen]);

  useEffect(() => {
    if (!isEligible || blocked || isOpen) return;
    const timeoutId = window.setTimeout(() => {
      setIsOpen(true);
    }, PROMPT_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [blocked, isEligible, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscClose = (event: KeyboardEvent) => {
      if (event.key === 'Escape') markAsSeen();
    };

    window.addEventListener('keydown', handleEscClose);
    return () => window.removeEventListener('keydown', handleEscClose);
  }, [isOpen, markAsSeen]);

  useEffect(() => {
    if (blocked && isOpen) {
      setIsOpen(false);
    }
  }, [blocked, isOpen]);

  const handleNativeInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    const promptEvent = deferredPrompt;
    setDeferredPrompt(null);

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        markAsSeen();
      }
    } catch {
      // Ignore prompt errors and keep manual instructions available.
    }
  }, [deferredPrompt, markAsSeen]);

  const isAndroidNativeInstallAvailable = activeTab === 'android' && Boolean(deferredPrompt);

  const iphoneSteps = useMemo(
    () => [
      { icon: <Globe size={16} className="text-mil-light" />, text: 'Abra o site no Safari.' },
      {
        icon: <Share2 size={16} className="text-mil-light" />,
        text: 'Toque no botão de compartilhar (ícone de seta para cima).',
      },
      {
        icon: <PlusSquare size={16} className="text-mil-light" />,
        text: 'Toque em "Adicionar à Tela de Início".',
      },
      { icon: <Plus size={16} className="text-mil-light" />, text: 'Confirme tocando em "Adicionar".' },
    ],
    [],
  );

  const androidSteps = useMemo(
    () => [
      { icon: <Globe size={16} className="text-mil-light" />, text: 'Abra o site no Chrome.' },
      {
        icon: <EllipsisVertical size={16} className="text-mil-light" />,
        text: 'Toque nos três pontinhos no canto superior direito.',
      },
      {
        icon: <Download size={16} className="text-mil-light" />,
        text: 'Toque em "Adicionar à tela inicial".',
      },
      { icon: <Plus size={16} className="text-mil-light" />, text: 'Confirme tocando em "Adicionar".' },
    ],
    [],
  );

  if (!isOpen) return null;

  const steps = activeTab === 'iphone' ? iphoneSteps : androidSteps;

  return (
    <div className="fixed inset-0 z-[55] bg-black/60 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Instruções para instalar o app"
        className="w-full max-w-sm rounded-2xl border border-mil-medium bg-mil-dark px-5 py-6 shadow-2xl"
      >
        <img src={APP_ICON_URL} alt="Ícone do app" className="h-14 w-14 mx-auto rounded-xl mb-4" />

        <h2 className="text-center text-2xl font-heading font-bold text-mil-red">
          Adicione o App na tela inicial
        </h2>
        <p className="mt-2 text-center text-sm text-mil-light/90">
          Fica mais rápido de acessar, direto do seu celular.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('iphone')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === 'iphone'
                ? 'bg-mil-red text-mil-light'
                : 'bg-mil-medium text-mil-neutral hover:text-mil-light'
            }`}
          >
            iPhone
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === 'android'
                ? 'bg-mil-red text-mil-light'
                : 'bg-mil-medium text-mil-neutral hover:text-mil-light'
            }`}
          >
            Android
          </button>
        </div>

        <p className="mt-4 text-xs uppercase tracking-wide text-mil-neutral">
          {activeTab === 'iphone' ? 'No iPhone (Safari):' : 'No Android (Chrome):'}
        </p>

        {isAndroidNativeInstallAvailable ? (
          <button
            type="button"
            onClick={handleNativeInstall}
            className="mt-3 w-full rounded-xl bg-mil-gold px-4 py-3 text-sm font-bold text-mil-black hover:brightness-95 transition"
          >
            Instalar agora
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            {steps.map((step, index) => (
              <div key={step.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mil-red text-xs font-bold text-mil-light">
                  {index + 1}
                </span>
                <div className="min-w-0 flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">{step.icon}</span>
                  <p className="text-sm leading-6 text-mil-light/95">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={markAsSeen}
          className="mt-6 w-full rounded-xl bg-mil-red px-4 py-3 text-sm font-bold text-mil-light hover:brightness-95 transition"
        >
          Entendi
        </button>
        <p className="mt-2 text-center text-xs text-mil-neutral">
          Você pode fazer isso depois, quando quiser.
        </p>
      </div>
    </div>
  );
}
