import { Item } from '../types';

const ITEM_TYPE_LABELS: Record<Item['type'], string> = {
  pdf: 'PDF',
  audio: 'ÁUDIO',
  video: 'VÍDEO',
  text: 'TEXTO',
  image: 'IMAGEM',
};

export function getItemTypeLabel(type: Item['type'] | string): string {
  const normalized = type.trim().toLowerCase();
  return ITEM_TYPE_LABELS[normalized as Item['type']] ?? type.toUpperCase();
}
