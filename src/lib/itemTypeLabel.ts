import { Item } from '../types';

const ITEM_TYPE_LABELS: Record<Item['type'], string> = {
  pdf: 'PDF',
  audio: 'AUDIO',
  video: 'VIDEO',
  text: 'TEXTO',
  image: 'IMAGEM'
};

export function getItemTypeLabel(type: Item['type'] | string): string {
  const normalized = type.trim().toLowerCase();
  return ITEM_TYPE_LABELS[normalized as Item['type']] ?? type.toUpperCase();
}
