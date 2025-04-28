import { createClient } from '@supabase/supabase-js';

// ── 1. Supabase 配置 ──────────────────────────────────────────────
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase      = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── 2. Bot UA 关键词，可自行增删 ──────────────────────────────────
const BOT_KEYWORDS = [
  'bot', 'crawler', 'spider', 'curl',
  'ahrefs', 'python-requests', 'axios', 'wget'
];

// ── 3. Serverless Handler ───────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ message: 'Only POST requests allowed' });

  // 取得子域名前缀
  const host = req.headers.host || '';
  if (!host.endsWith('buttonofdictator.xyz'))
    return res.status(400).json({ message: 'Invalid host' });

  const subdomain = host.replace('.buttonofdictator.xyz', '');
  const { username, action } = req.body || {};

  if (!subdomain || !action)
    return res.status(400).json({ message: 'Missing required fields' });

  // ── 4. 防爬虫：仅拦截 access 行为 ───────────────────────────────
  if (action === 'access') {
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = BOT_KEYWORDS.some(k => ua.includes(k));
    if (isBot) {
      console.warn(`[bot-block] sub=${subdomain}  ua=${ua}`);
      return res.status(403).json({ message: 'Bot access blocked' });
    }
  }

  try {
    // ── 5. 根据 action 更新 ──────────────────────────────────────
    if (action === 'access') {
      await supabase.from('logs').update({
        status: 'accessed',
        accessTime: new Date().toISOString()
      }).eq('subdomain', subdomain);

    } else if (action === 'assign') {
      if (!username)
        return res.status(400).json({ message: 'Missing username for assign' });

      await supabase.from('logs').update({ assignedTo: username })
                    .eq('subdomain', subdomain);

    } else if (action === 'terminate') {
      if (!username)
        return res.status(400).json({ message: 'Missing username for terminate' });

      await supabase.from('logs').update({
        terminatedBy: username,
        terminationTime: new Date().toISOString(),
        status: 'terminated'
      }).eq('subdomain', subdomain);

    } else {
      return res.status(400).json({ message: 'Invalid action type' });
    }

    return res.status(200).json({ message: 'Update successful' });

  } catch (err) {
    console.error('Supabase update error:', err);
    return res.status(500).json({ message: 'Update failed', error: err.message });
  }
}
