import { get, set, del, keys } from 'idb-keyval';

export const db = {
  async get<T>(key: string): Promise<T | undefined> {
    return get(key);
  },
  async set(key: string, value: any): Promise<void> {
    return set(key, value);
  },
  async remove(key: string): Promise<void> {
    return del(key);
  },
  async clear(): Promise<void> {
    const allKeys = await keys();
    await Promise.all(allKeys.map((k) => del(k)));
  }
};
