import { registerSW } from 'virtual:pwa-register';

export type PwaUpdateState = {
  needRefresh: boolean;
  offlineReady: boolean;
  updateInProgress: boolean;
  bannerDismissed: boolean;
};

type Listener = (state: PwaUpdateState) => void;

const UPDATE_CHECK_THROTTLE_MS = 15_000;

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;
let isRegistered = false;
let isCheckingForUpdate = false;
let lastUpdateCheckAt = 0;
let state: PwaUpdateState = {
  needRefresh: false,
  offlineReady: false,
  updateInProgress: false,
  bannerDismissed: false,
};

const listeners = new Set<Listener>();

function emitState() {
  listeners.forEach((listener) => listener(state));
}

function setState(nextState: Partial<PwaUpdateState>) {
  state = {
    ...state,
    ...nextState,
  };
  emitState();
}

function isEditableElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  return element.isContentEditable;
}

function isSafeToAutoApplyUpdate(): boolean {
  if (state.updateInProgress) return false;
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const currentPath = window.location.pathname.toLowerCase();
  if (currentPath.startsWith('/suggestion')) return false;

  if (isEditableElement(document.activeElement)) return false;

  return true;
}

async function maybeApplyUpdateAutomatically() {
  if (!state.needRefresh || !isSafeToAutoApplyUpdate()) return;
  await applyPwaUpdate();
}

async function runUpdateCheck(force = false): Promise<void> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  if (isCheckingForUpdate || state.updateInProgress) return;

  const now = Date.now();
  if (!force && now - lastUpdateCheckAt < UPDATE_CHECK_THROTTLE_MS) return;

  isCheckingForUpdate = true;
  lastUpdateCheckAt = now;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;

    await registration.update();
    await maybeApplyUpdateAutomatically();
  } catch {
    // Ignore update check failures and keep current app state.
  } finally {
    isCheckingForUpdate = false;
  }
}

export function getPwaUpdateState(): PwaUpdateState {
  return state;
}

export function subscribePwaUpdate(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

export function registerAppServiceWorker(): void {
  if (isRegistered) return;
  isRegistered = true;

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    updateServiceWorker = registerSW({
      immediate: true,
      onOfflineReady() {
        setState({ offlineReady: true });
      },
      onNeedRefresh() {
        setState({
          needRefresh: true,
          bannerDismissed: false,
        });
        void maybeApplyUpdateAutomatically();
      },
    });

    const triggerForegroundCheck = () => {
      void runUpdateCheck();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void runUpdateCheck();
      }
    };

    window.addEventListener('pageshow', triggerForegroundCheck);
    window.addEventListener('focus', triggerForegroundCheck);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    void runUpdateCheck(true);
    return;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }
}

export function dismissPwaUpdateBanner(): void {
  setState({ bannerDismissed: true });
}

export async function applyPwaUpdate(): Promise<void> {
  if (!updateServiceWorker || state.updateInProgress) return;

  setState({ updateInProgress: true });

  try {
    await updateServiceWorker(true);
  } catch {
    setState({ updateInProgress: false });
  }
}

export async function checkForPwaUpdate(): Promise<void> {
  await runUpdateCheck(true);
}
