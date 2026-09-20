import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_PREFIXES = ['data_sources/', 'pages', 'databases', 'blocks/', 'search'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.headers['x-app-passphrase'] !== process.env.APP_PASSPHRASE) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { path, method = 'GET', body } = req.body as {
    path: string;
    method?: string;
    body?: unknown;
  };

  if (
    typeof path !== 'string' ||
    !ALLOWED_PREFIXES.some((p) => path.startsWith(p))
  ) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const notionRes = await fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2025-09-03',
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  const data = (await notionRes.json()) as unknown;
  return res.status(notionRes.status).json(data);
}
