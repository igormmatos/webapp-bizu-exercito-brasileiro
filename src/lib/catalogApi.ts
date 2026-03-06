import { supabase } from './supabase';
import { db } from './db';
import { Category, Item } from '../types';

const CACHE_KEYS = {
  CATEGORIES: 'catalog_categories',
  ITEMS: 'catalog_items',
  LAST_SYNC: 'catalog_last_sync'
};

export type CatalogSyncOrigin = 'auto' | 'manual';

export type CatalogSyncState = {
  inProgress: boolean;
  isFirstSync: boolean;
  origin: CatalogSyncOrigin | null;
};

type FetchCatalogOptions = {
  origin?: CatalogSyncOrigin;
};

type SyncListener = (state: CatalogSyncState) => void;

let inFlightSync: Promise<{ categories: Category[]; items: Item[] }> | null = null;
let syncState: CatalogSyncState = {
  inProgress: false,
  isFirstSync: false,
  origin: null
};
const syncListeners = new Set<SyncListener>();

function emitSyncState() {
  syncListeners.forEach((listener) => listener(syncState));
}

function setSyncState(next: Partial<CatalogSyncState>) {
  syncState = {
    ...syncState,
    ...next
  };
  emitSyncState();
}

export function getCatalogSyncState(): CatalogSyncState {
  return syncState;
}

export function subscribeCatalogSync(listener: SyncListener): () => void {
  syncListeners.add(listener);
  listener(syncState);
  return () => {
    syncListeners.delete(listener);
  };
}

export async function fetchCatalog(options?: FetchCatalogOptions) {
  const origin = options?.origin || 'auto';

  if (inFlightSync) {
    if (origin === 'manual' && syncState.origin !== 'manual') {
      setSyncState({ origin: 'manual' });
    }
    return inFlightSync;
  }

  inFlightSync = (async () => {
    const hasSyncedBefore = Boolean(await db.get<number>(CACHE_KEYS.LAST_SYNC));

    setSyncState({
      inProgress: true,
      isFirstSync: !hasSyncedBefore,
      origin
    });

    if (supabase) {
      try {
        const [{ data: categories }, { data: items }] = await Promise.all([
          supabase.from('categories').select('*').eq('published', true).order('sort_order'),
          supabase.from('items').select('*').eq('published', true)
        ]);

        if (categories && items) {
          await db.set(CACHE_KEYS.CATEGORIES, categories);
          await db.set(CACHE_KEYS.ITEMS, items);
          await db.set(CACHE_KEYS.LAST_SYNC, Date.now());
          return { categories, items };
        }
      } catch (error) {
        console.error('Error fetching catalog from Supabase:', error);
      }
    }

    // Fallback to cache
    const cachedCategories = await db.get<Category[]>(CACHE_KEYS.CATEGORIES);
    const cachedItems = await db.get<Item[]>(CACHE_KEYS.ITEMS);

    return {
      categories: cachedCategories || [],
      items: cachedItems || []
    };
  })();

  try {
    return await inFlightSync;
  } finally {
    inFlightSync = null;
    setSyncState({
      inProgress: false,
      isFirstSync: false,
      origin: null
    });
  }
}

export async function getCategories(): Promise<Category[]> {
  const cached = await db.get<Category[]>(CACHE_KEYS.CATEGORIES);
  if (cached && cached.length > 0) return cached;
  const { categories } = await fetchCatalog({ origin: 'auto' });
  return categories;
}

export async function getItems(): Promise<Item[]> {
  const cached = await db.get<Item[]>(CACHE_KEYS.ITEMS);
  if (cached && cached.length > 0) return cached;
  const { items } = await fetchCatalog({ origin: 'auto' });
  return items;
}

export async function getItemById(id: string): Promise<Item | undefined> {
  const items = await getItems();
  return items.find(item => item.id === id);
}

export async function getItemsByCategory(categoryId: string): Promise<Item[]> {
  const items = await getItems();
  return items.filter(item => item.category_id === categoryId);
}
