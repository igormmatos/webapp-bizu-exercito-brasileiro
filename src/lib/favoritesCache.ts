import { db } from './db';
import { Item } from '../types';

const FAVORITES_KEY = 'user_favorites';

export async function getFavorites(): Promise<string[]> {
  const favs = await db.get<string[]>(FAVORITES_KEY);
  return favs || [];
}

export async function toggleFavorite(itemId: string): Promise<boolean> {
  const favs = await getFavorites();
  const isFav = favs.includes(itemId);
  
  let newFavs;
  if (isFav) {
    newFavs = favs.filter(id => id !== itemId);
  } else {
    newFavs = [...favs, itemId];
  }
  
  await db.set(FAVORITES_KEY, newFavs);
  return !isFav;
}

export async function isFavorite(itemId: string): Promise<boolean> {
  const favs = await getFavorites();
  return favs.includes(itemId);
}
