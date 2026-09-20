const PASSPHRASE = import.meta.env.VITE_APP_PASSPHRASE as string;

export interface ProxyRequest {
  path: string;
  method?: string;
  body?: unknown;
}

export async function notionProxy<T>(req: ProxyRequest): Promise<T> {
  const res = await fetch('/api/notion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-passphrase': PASSPHRASE,
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Proxy ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json() as Promise<T>;
}
