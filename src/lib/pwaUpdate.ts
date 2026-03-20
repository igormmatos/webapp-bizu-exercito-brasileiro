import { registerSW } from 'virtual:pwa-register';

export type PwaUpdateState = {
  needRefresh: boolean;
  offlineReady: boolean;
  updateInProgress: boolean;
  bannerDismissed: boolean;
};

type Listener = (state: PwaUpdateState) => void;

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;
let isRegistered = false;
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
      },
    });
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
  if (!updateServiceWorker) return;

  setState({ updateInProgress: true });

  try {
    await updateServiceWorker(true);
  } catch {
    setState({ updateInProgress: false });
  }
}
