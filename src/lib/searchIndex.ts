import { Item } from '../types';
import { getItems } from './catalogApi';

export async function searchItems(query: string): Promise<Item[]> {
  const items = await getItems();
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  return items.filter(item => {
    const searchableText = [
      item.title,
      item.description,
      item.text_body,
      ...(item.tags || [])
    ].join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return searchableText.includes(normalizedQuery);
  });
}
