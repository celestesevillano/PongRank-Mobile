import { storage } from '@/lib/storage';

const ACCESS_KEY = 'pongrank.accessToken';
const REFRESH_KEY = 'pongrank.refreshToken';

let accessToken: string | null = null;

export const tokenStore = {
  async load() {
    accessToken = await storage.getItem(ACCESS_KEY);
    return accessToken;
  },
  getAccess: () => accessToken,
  getRefresh: () => storage.getItem(REFRESH_KEY),
  async save(access: string, refresh: string) {
    accessToken = access;
    await Promise.all([storage.setItem(ACCESS_KEY, access), storage.setItem(REFRESH_KEY, refresh)]);
  },
  async clear() {
    accessToken = null;
    await Promise.all([storage.deleteItem(ACCESS_KEY), storage.deleteItem(REFRESH_KEY)]);
  },
};
