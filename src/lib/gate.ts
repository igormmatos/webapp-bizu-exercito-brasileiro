import { GateStatus } from '../types';

const GATE_STATE_KEY = 'gate_state';

export const GATE_UNLOCK_DURATION_MS = 10 * 60 * 1000;

type StoredGateState = Record<string, { unlocked: boolean; expiresAt: number }>;

export type GateCheckResult = {
  status: GateStatus;
  expired: boolean;
};

let memoryGateState: StoredGateState = {};

function readStoredGateState(): StoredGateState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return memoryGateState;
  }

  try {
    const raw = window.localStorage.getItem(GATE_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};

    const normalized: StoredGateState = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([categoryId, value]) => {
      if (typeof value !== 'object' || value === null) return;
      const entry = value as { unlocked?: unknown; expiresAt?: unknown };
      const expiresAt = entry.expiresAt;
      const unlocked = entry.unlocked;
      if (typeof expiresAt === 'number' && Number.isFinite(expiresAt)) {
        normalized[categoryId] = {
          unlocked: typeof unlocked === 'boolean' ? unlocked : true,
          expiresAt,
        };
      }
    });

    return normalized;
  } catch {
    return {};
  }
}

function writeStoredGateState(state: StoredGateState) {
  memoryGateState = state;

  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    window.localStorage.setItem(GATE_STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable on private browsing modes.
  }
}

export function getCategoryGateStatus(categoryId: string): GateCheckResult {
  if (!categoryId) {
    return {
      status: { categoryId, unlocked: true, expiresAt: 0 },
      expired: false,
    };
  }

  const state = readStoredGateState();
  const entry = state[categoryId];

  if (!entry) {
    return {
      status: { categoryId, unlocked: false, expiresAt: 0 },
      expired: false,
    };
  }

  if (!entry.unlocked) {
    return {
      status: { categoryId, unlocked: false, expiresAt: 0 },
      expired: false,
    };
  }

  if (entry.expiresAt <= Date.now()) {
    const nextState = { ...state };
    delete nextState[categoryId];
    writeStoredGateState(nextState);

    return {
      status: { categoryId, unlocked: false, expiresAt: 0 },
      expired: true,
    };
  }

  return {
    status: {
      categoryId,
      unlocked: true,
      expiresAt: entry.expiresAt,
    },
    expired: false,
  };
}

export function unlockCategory(categoryId: string, durationMs = GATE_UNLOCK_DURATION_MS): GateStatus {
  const expiresAt = Date.now() + durationMs;
  const state = readStoredGateState();
  const nextState = {
    ...state,
    [categoryId]: { unlocked: true, expiresAt },
  };
  writeStoredGateState(nextState);

  return {
    categoryId,
    unlocked: true,
    expiresAt,
  };
}
