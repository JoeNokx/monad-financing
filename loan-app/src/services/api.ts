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
      res = await fetch(requestUrl, {
        method: input.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
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
    const data = text ? (JSON.parse(text) as unknown) : null;

    if (!res.ok) {
      const message = typeof data === 'object' && data && 'message' in (data as any) ? String((data as any).message) : `Request failed (${res.status})`;
      throw new Error(message);
    }

    return data as T;
  }

  return { request };
}
