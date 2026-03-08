import { MonetizationEvent } from '../types';

const MONETIZATION_EVENTS_KEY = 'monetization_events';
const MONETIZATION_EVENTS_LIMIT = 100;

type MonetizationEventEntry = {
  event: MonetizationEvent;
  timestamp: number;
  payload?: Record<string, unknown>;
};

let memoryEvents: MonetizationEventEntry[] = [];

function readStoredEvents(): MonetizationEventEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return memoryEvents;
  }

  try {
    const raw = window.localStorage.getItem(MONETIZATION_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry) => {
      if (typeof entry !== 'object' || entry === null) return false;
      const candidate = entry as Partial<MonetizationEventEntry>;
      return (
        typeof candidate.event === 'string' &&
        typeof candidate.timestamp === 'number'
      );
    }) as MonetizationEventEntry[];
  } catch {
    return [];
  }
}

function writeStoredEvents(events: MonetizationEventEntry[]) {
  memoryEvents = events;

  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    window.localStorage.setItem(MONETIZATION_EVENTS_KEY, JSON.stringify(events));
  } catch {
    // In storage restricted contexts we keep memory-only buffer.
  }
}

export function trackMonetizationEvent(
  event: MonetizationEvent,
  payload?: Record<string, unknown>,
) {
  const entry: MonetizationEventEntry = {
    event,
    timestamp: Date.now(),
    payload,
  };

  const nextEvents = [...readStoredEvents(), entry].slice(-MONETIZATION_EVENTS_LIMIT);
  writeStoredEvents(nextEvents);

  console.log('[monetization]', event, payload || {});
}

export function getMonetizationEvents() {
  return readStoredEvents();
}
