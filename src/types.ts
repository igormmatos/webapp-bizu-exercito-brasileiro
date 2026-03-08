export type Category = {
  id: string;
  name: string;
  sort_order: number;
  published: boolean;
};

export type Item = {
  id: string;
  title: string;
  type: 'pdf' | 'audio' | 'video' | 'text' | 'image';
  category_id: string;
  published: boolean;
  letter?: boolean;
  storage_path?: string;
  text_body?: string;
  link?: string;
  tags?: string[];
  description?: string;
};

export type GateStatus = {
  categoryId: string;
  unlocked: boolean;
  expiresAt: number;
};

export type FavoriteActionResult =
  | { status: 'added'; count: number; categoryId: string }
  | { status: 'removed'; count: number; categoryId: string }
  | { status: 'limit_reached'; count: number; categoryId: string; limit: number };

export type MonetizationEvent =
  | 'gate_opened'
  | 'countdown_start'
  | 'countdown_end'
  | 'gate_unlocked'
  | 'gate_expired'
  | 'favoritos_limit_reached';

export type NoticeVariant = 'success' | 'error' | 'warning';

export type NoticePayload = {
  message: string;
  variant: NoticeVariant;
  durationMs?: number;
};

export type Suggestion = {
  id?: string;
  message: string;
  category?: string;
  contact?: string;
  app_version?: string;
  device?: string;
  status?: string;
};
