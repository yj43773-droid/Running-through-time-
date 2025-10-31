import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  StoredTokens,
} from './authStorage';

const DEFAULT_BASE_URL = 'http://localhost:5000/api';

const apiBaseUrl = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.replace(/\/$/, '');
  }
  return DEFAULT_BASE_URL;
})();

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

interface ApiRequestOptions {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

interface InternalRequestOptions extends ApiRequestOptions {
  accessTokenOverride?: string | null;
  skipRefresh?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

const withBaseUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (!path.startsWith('/')) {
    return `${apiBaseUrl}/${path}`;
  }
  return `${apiBaseUrl}${path}`;
};

const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== 'undefined' && value instanceof FormData;

const parseErrorPayload = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
};

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === 'object') {
    const maybeRecord = payload as Record<string, unknown>;
    const messageCandidate = maybeRecord.error ?? maybeRecord.message;
    if (typeof messageCandidate === 'string' && messageCandidate.trim()) {
      return messageCandidate;
    }
  }
  return fallback;
};

const requestAccessTokenRefresh = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(withBaseUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        clearTokens();
        return null;
      }

      const payload = await response.json().catch(() => null);
      const nextAccessToken =
        payload && typeof payload === 'object'
          ? (payload as Record<string, unknown>).accessToken
          : null;

      if (typeof nextAccessToken === 'string' && nextAccessToken.trim()) {
        const tokens: StoredTokens = {
          accessToken: nextAccessToken,
          refreshToken: refreshToken,
        };
        setTokens(tokens);
        return nextAccessToken;
      }

      clearTokens();
      return null;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

const internalFetch = async <T>(
  path: string,
  options: InternalRequestOptions = {},
): Promise<T> => {
  const { auth = true } = options;

  const internal: InternalRequestOptions = { ...options };
  internal.accessTokenOverride ??= getAccessToken();

  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;

  if (
    internal.body !== undefined &&
    internal.body !== null &&
    !isFormData(internal.body)
  ) {
    if (typeof internal.body === 'string') {
      body = internal.body;
    } else {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(internal.body);
    }
  } else if (isFormData(internal.body)) {
    body = internal.body;
  }

  if (auth && internal.accessTokenOverride) {
    headers.set('Authorization', `Bearer ${internal.accessTokenOverride}`);
  }

  const response = await fetch(withBaseUrl(path), {
    method: internal.method ?? 'GET',
    headers,
    body,
    signal: internal.signal,
  });

  if (response.status === 401 && auth && !internal.skipRefresh) {
    const refreshedToken = await requestAccessTokenRefresh();
    if (refreshedToken) {
      return internalFetch<T>(path, {
        ...internal,
        skipRefresh: true,
        accessTokenOverride: refreshedToken,
      });
    }
    clearTokens();
    throw new ApiError('Unauthorized', 401, null);
  }

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    const message = extractErrorMessage(payload, response.statusText);
    throw new ApiError(message || 'Request failed', response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
};

export const apiFetch = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => internalFetch<T>(path, options);

export const updateStoredTokens = (tokens: StoredTokens): void => {
  setTokens(tokens);
};

export const resetStoredTokens = (): void => {
  clearTokens();
};
