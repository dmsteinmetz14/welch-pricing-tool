interface BaserowErrorPayload {
  error?: string;
  detail?: string;
}

const BASEROW_API_URL = process.env.BASEROW_API_URL ?? 'https://api.baserow.io';
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;

export async function baserowFetch<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  if (!BASEROW_TOKEN) {
    throw new Error('Missing BASEROW_TOKEN environment variable');
  }
  const url = new URL(path, BASEROW_API_URL);
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Token ${BASEROW_TOKEN}`);
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  const response = await fetch(url, {
    ...init,
    headers
  });

  const payload = (await response.json().catch(() => ({}))) as TResponse & BaserowErrorPayload;
  if (!response.ok) {
    const message = (payload.error || payload.detail || 'Baserow request failed') as string;
    throw new Error(message);
  }

  return payload as TResponse;
}
