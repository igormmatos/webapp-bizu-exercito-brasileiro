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
import { X } from 'lucide-react';
import { NoticePayload, NoticeVariant } from '../types';

const MAX_VISIBLE_NOTICES = 3;

const DEFAULT_DURATION_BY_VARIANT: Record<NoticeVariant, number> = {
  success: 3000,
  warning: 4000,
  error: 4000,
};

type NoticeItem = NoticePayload & {
  id: number;
};

type NoticeContextValue = {
  showNotice: (payload: NoticePayload) => void;
  dismissNotice: (id: number) => void;
};

type NoticeProviderProps = {
  children: ReactNode;
};

const NoticeContext = createContext<NoticeContextValue | null>(null);

function getNoticeVariantStyles(variant: NoticeVariant) {
  if (variant === 'success') {
    return {
      containerClassName: 'bg-mil-light text-mil-black border-mil-gold/70',
      labelClassName: 'text-mil-medium',
      buttonClassName: 'text-mil-black/60 hover:text-mil-black',
      label: 'Sucesso',
    };
  }

  if (variant === 'error') {
    return {
      containerClassName: 'bg-mil-light text-mil-black border-mil-red/70',
      labelClassName: 'text-mil-red',
      buttonClassName: 'text-mil-black/60 hover:text-mil-black',
      label: 'Erro',
    };
  }

  return {
    containerClassName: 'bg-[#611515] text-[#E5C543] border-[#E5C543]/50',
    labelClassName: 'text-[#E5C543]',
    buttonClassName: 'text-[#E5C543]/70 hover:text-[#E5C543]',
    label: 'Aviso',
  };
}

export default function NoticeProvider({ children }: NoticeProviderProps) {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const nextNoticeIdRef = useRef(1);
  const timeoutByNoticeIdRef = useRef<Record<number, number>>({});

  const clearNoticeTimeout = useCallback((noticeId: number) => {
    const timeoutId = timeoutByNoticeIdRef.current[noticeId];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete timeoutByNoticeIdRef.current[noticeId];
    }
  }, []);

  const dismissNotice = useCallback((noticeId: number) => {
    clearNoticeTimeout(noticeId);
    setNotices((currentNotices) => currentNotices.filter((notice) => notice.id !== noticeId));
  }, [clearNoticeTimeout]);

  const showNotice = useCallback((payload: NoticePayload) => {
    const noticeId = nextNoticeIdRef.current++;
    const durationMs = payload.durationMs ?? DEFAULT_DURATION_BY_VARIANT[payload.variant];
    const notice: NoticeItem = {
      id: noticeId,
      message: payload.message,
      variant: payload.variant,
      durationMs,
    };

    setNotices((currentNotices) => {
      const overflowCount = Math.max(currentNotices.length + 1 - MAX_VISIBLE_NOTICES, 0);
      if (overflowCount > 0) {
        currentNotices
          .slice(0, overflowCount)
          .forEach((overflowNotice) => clearNoticeTimeout(overflowNotice.id));
      }

      return [...currentNotices, notice].slice(-MAX_VISIBLE_NOTICES);
    });

    const timeoutId = window.setTimeout(() => {
      dismissNotice(noticeId);
    }, durationMs);

    timeoutByNoticeIdRef.current[noticeId] = timeoutId;
  }, [clearNoticeTimeout, dismissNotice]);

  useEffect(() => {
    return () => {
      const timeoutIds = Object.values(timeoutByNoticeIdRef.current) as number[];
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutByNoticeIdRef.current = {};
    };
  }, []);

  const contextValue = useMemo<NoticeContextValue>(
    () => ({
      showNotice,
      dismissNotice,
    }),
    [dismissNotice, showNotice],
  );

  return (
    <NoticeContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] px-3 pt-3 pb-2 sm:px-4">
        <div className="mx-auto w-full max-w-md space-y-2">
          {notices.map((notice) => {
            const styles = getNoticeVariantStyles(notice.variant);

            return (
              <div
                key={notice.id}
                className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-xl ${styles.containerClassName}`}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-[11px] uppercase tracking-[0.2em] font-semibold ${styles.labelClassName}`}>
                      {styles.label}
                    </p>
                    <p className="mt-1 text-sm font-medium break-words">{notice.message}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissNotice(notice.id)}
                    className={`shrink-0 transition ${styles.buttonClassName}`}
                    aria-label="Fechar aviso"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </NoticeContext.Provider>
  );
}

export function useNotice() {
  const context = useContext(NoticeContext);
  if (!context) {
    throw new Error('useNotice must be used within NoticeProvider.');
  }

  return context;
}
