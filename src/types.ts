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

export type Suggestion = {
  id?: string;
  message: string;
  category?: string;
  contact?: string;
  app_version?: string;
  device?: string;
  status?: string;
};
