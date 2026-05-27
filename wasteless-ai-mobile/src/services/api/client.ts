const DEFAULT_HEADERS = {
  Accept: 'application/json',
};

export type ApiRequestOptions = RequestInit & {
  authToken?: string;
  contentType?: 'json' | 'form-data';
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getApiBaseUrl() {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '') ?? '';

  return baseUrl.replace(/\/api$/i, '');
}

function buildApiUrl(baseUrl: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;

  return `${baseUrl}/${path.replace(/^\/+/, '')}`;
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function readErrorMessage(response: Response) {
  const fallbackMessage = `Request failed with status ${response.status}`;
  const payload = await readResponsePayload(response);

  if (payload && typeof payload === 'object') {
    const candidate = payload as { error?: unknown; message?: unknown };
    if (typeof candidate.error === 'string') return candidate.error;
    if (typeof candidate.message === 'string') return candidate.message;
  }

  if (typeof payload === 'string' && payload.trim().length > 0) {
    return fallbackMessage;
  }

  return fallbackMessage;
}

export function getApiErrorMessage(error: unknown, fallbackMessage = 'Something went wrong.') {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;

  return fallbackMessage;
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new ApiError('EXPO_PUBLIC_API_URL is not configured.', 0);
  }

  const { authToken, contentType = 'json', headers: customHeaders, ...requestOptions } = options;
  const headers = new Headers(DEFAULT_HEADERS);

  if (contentType === 'json') {
    headers.set('Content-Type', 'application/json');
  }

  new Headers(customHeaders).forEach((value, key) => {
    headers.set(key, value);
  });

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(baseUrl, path), {
      credentials: 'include',
      ...requestOptions,
      headers,
    });
  } catch {
    throw new ApiError('Unable to reach the WasteLessAI API. Check your connection and API URL.', 0);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await readResponsePayload(response)) as TResponse;
}
