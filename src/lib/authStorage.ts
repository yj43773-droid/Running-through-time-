const ACCESS_TOKEN_KEY = 'heartorb.accessToken';
const REFRESH_TOKEN_KEY = 'heartorb.refreshToken';
const USER_KEY = 'heartorb.user';

type NullableString = string | null;

const isBrowser = typeof window !== 'undefined';

export interface StoredUser {
  id: string;
  email: string;
  name?: string | null;
  displayName?: string | null;
  createdAt?: string | null;
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export const getAccessToken = (): NullableString => {
  if (!isBrowser) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): NullableString => {
  if (!isBrowser) return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (tokens: StoredTokens): void => {
  if (!isBrowser) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const clearTokens = (): void => {
  if (!isBrowser) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const storeUser = (user: StoredUser): void => {
  if (!isBrowser) return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = (): StoredUser | null => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const clearStoredUser = (): void => {
  if (!isBrowser) return;
  window.localStorage.removeItem(USER_KEY);
};
