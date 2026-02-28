import { BASE_URL } from '../config/api.config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiClientOptions = {
  getToken?: () => Promise<string | null>;
  timeoutMs?: number;
};

type ApiRequestOptions = {
  method?: HttpMethod;
  path: string;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

export function createApiClient(options: ApiClientOptions = {}) {
  async function request<T>(input: ApiRequestOptions): Promise<T> {
    const token = input.token ?? (options.getToken ? await options.getToken() : null);

    const requestUrl = `${BASE_URL}${input.path}`;

    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      const isFormData =
        typeof FormData !== 'undefined' &&
        input.body !== undefined &&
        input.body !== null &&
        input.body instanceof FormData;

      res = await fetch(requestUrl, {
        method: input.method ?? 'GET',
        headers: {
          ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(input.headers ?? {}),
        },
        body: input.body === undefined ? undefined : isFormData ? (input.body as any) : JSON.stringify(input.body),
        signal: controller.signal,
      });
    } catch (e) {
      const message =
        e instanceof Error && (e.name === 'AbortError' || e.message.toLowerCase().includes('aborted'))
          ? `Request timed out (${requestUrl})`
          : e instanceof Error
            ? `${e.message} (${requestUrl})`
            : `Network error (${requestUrl})`;
      throw new Error(message);
    } finally {
      clearTimeout(timeoutId);
    }

    const text = await res.text();
    const contentType = res.headers.get('content-type') ?? '';
    const trimmed = text.trim();

    let data: unknown = null;
    const shouldTryJson =
      trimmed.length > 0 &&
      (contentType.toLowerCase().includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('['));

    if (shouldTryJson) {
      try {
        data = JSON.parse(trimmed) as unknown;
      } catch {
        data = text;
      }
    } else {
      data = trimmed.length > 0 ? text : null;
    }

    if (!res.ok) {
      const message =
        typeof data === 'object' && data && 'message' in (data as any)
          ? String((data as any).message)
          : typeof data === 'string' && data.trim().length > 0
            ? data.trim()
            : `Request failed (${res.status})`;
      throw new Error(message);
    }

    return data as T;
  }

  return { request };
}
