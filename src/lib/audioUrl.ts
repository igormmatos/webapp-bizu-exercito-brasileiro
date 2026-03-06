import { Item } from '../types';
import { supabase } from './supabase';

function normalizeStoragePath(path: string) {
  return path.trim().replace(/^\/+/, '').replace(/^content\/+/i, '');
}

export function getItemAudioUrl(item: Item): string {
  if (item.type !== 'audio') return '';

  if (item.storage_path) {
    const cleanedPath = item.storage_path.trim();
    if (/^https?:\/\//i.test(cleanedPath)) return cleanedPath;

    if (supabase) {
      const normalizedPath = normalizeStoragePath(cleanedPath);
      if (normalizedPath) {
        const { data } = supabase.storage.from('content').getPublicUrl(normalizedPath);
        return data.publicUrl;
      }
    }
  }

  return item.link?.trim() || '';
}
