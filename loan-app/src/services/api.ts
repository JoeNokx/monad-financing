import { BASE_URL } from '../config/api.config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiClientOptions = {
  getToken?: () => Promise<string | null>;
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

    const res = await fetch(`${BASE_URL}${input.path}`, {
      method: input.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
    });

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
