import { db } from './db';
import { FavoriteActionResult } from '../types';
import { getItems } from './catalogApi';

const FAVORITES_KEY = 'user_favorites';
const FAVORITES_CATEGORY_KEY = 'user_favorites_category_map';
const FAVORITES_LIMIT_PER_CATEGORY = 3;

type FavoriteCategoryMap = Record<string, string>;

export async function getFavorites(): Promise<string[]> {
  const favs = await db.get<string[]>(FAVORITES_KEY);
  return favs || [];
}

async function getFavoriteCategoryMap(): Promise<FavoriteCategoryMap> {
  const favoriteCategoryMap = await db.get<FavoriteCategoryMap>(FAVORITES_CATEGORY_KEY);
  return favoriteCategoryMap || {};
}

async function ensureFavoriteCategoryMap(favorites: string[]): Promise<FavoriteCategoryMap> {
  const favoriteCategoryMap = await getFavoriteCategoryMap();
  const missingFavoriteIds = favorites.filter((favoriteId) => !favoriteCategoryMap[favoriteId]);

  if (missingFavoriteIds.length === 0) {
    return favoriteCategoryMap;
  }

  try {
    const items = await getItems();
    const categoryByItem = new Map(items.map((item) => [item.id, item.category_id]));
    const nextMap = { ...favoriteCategoryMap };
    let hasChanges = false;

    missingFavoriteIds.forEach((favoriteId) => {
      const categoryId = categoryByItem.get(favoriteId);
      if (!categoryId) return;
      nextMap[favoriteId] = categoryId;
      hasChanges = true;
    });

    if (hasChanges) {
      await db.set(FAVORITES_CATEGORY_KEY, nextMap);
      return nextMap;
    }
  } catch {
    // If category hydration fails we still keep old state.
  }

  return favoriteCategoryMap;
}

function countFavoritesByCategory(
  favorites: string[],
  favoriteCategoryMap: FavoriteCategoryMap,
  categoryId: string,
) {
  return favorites.reduce((count, favoriteId) => {
    return favoriteCategoryMap[favoriteId] === categoryId ? count + 1 : count;
  }, 0);
}

export async function toggleFavorite(itemId: string, categoryId: string): Promise<FavoriteActionResult> {
  const favorites = await getFavorites();
  const isAlreadyFavorite = favorites.includes(itemId);
  const favoriteCategoryMap = await ensureFavoriteCategoryMap(favorites);

  if (isAlreadyFavorite) {
    const nextFavorites = favorites.filter((favoriteId) => favoriteId !== itemId);
    const nextFavoriteCategoryMap = { ...favoriteCategoryMap };
    const removedCategoryId = nextFavoriteCategoryMap[itemId] || categoryId;
    delete nextFavoriteCategoryMap[itemId];

    const nextCount = countFavoritesByCategory(nextFavorites, nextFavoriteCategoryMap, removedCategoryId);

    await Promise.all([
      db.set(FAVORITES_KEY, nextFavorites),
      db.set(FAVORITES_CATEGORY_KEY, nextFavoriteCategoryMap),
    ]);

    return {
      status: 'removed',
      count: nextCount,
      categoryId: removedCategoryId,
    };
  }

  const currentCount = countFavoritesByCategory(favorites, favoriteCategoryMap, categoryId);
  if (currentCount >= FAVORITES_LIMIT_PER_CATEGORY) {
    return {
      status: 'limit_reached',
      count: currentCount,
      categoryId,
      limit: FAVORITES_LIMIT_PER_CATEGORY,
    };
  }

  const nextFavorites = [...favorites, itemId];
  const nextFavoriteCategoryMap = {
    ...favoriteCategoryMap,
    [itemId]: categoryId,
  };

  await Promise.all([
    db.set(FAVORITES_KEY, nextFavorites),
    db.set(FAVORITES_CATEGORY_KEY, nextFavoriteCategoryMap),
  ]);

  return {
    status: 'added',
    count: currentCount + 1,
    categoryId,
  };
}

export async function isFavorite(itemId: string): Promise<boolean> {
  const favs = await getFavorites();
  return favs.includes(itemId);
}
