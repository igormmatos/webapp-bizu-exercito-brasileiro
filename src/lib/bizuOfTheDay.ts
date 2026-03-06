import { getItems } from './catalogApi';
import { Item } from '../types';

export async function getBizuOfTheDay(): Promise<Item | null> {
  const items = await getItems();
  if (!items || items.length === 0) return null;

  // Determinist selection based on current date
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Simple pseudo-random using seed
  const index = seed % items.length;
  return items[index];
}
