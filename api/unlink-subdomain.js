import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const host = req.headers.host;
  let subdomain = null;

  if (host.endsWith('buttonofdictator.xyz')) {
    subdomain = host.replace('.buttonofdictator.xyz', '');
  }

  const body = req.body || {};  // 🛡️ 防止req.body为undefined
  const { username, action } = body;

  if (!subdomain) {
    return res.status(400).json({ message: 'Subdomain not found' });
  }

  try {
    if (action === 'access') {
      await supabase
        .from('logs')
        .update({ status: 'accessed', accessTime: new Date().toISOString() })
        .eq('subdomain', subdomain);
    } else if (action === 'assign') {
      if (!username) {
        return res.status(400).json({ message: 'Missing username for assign action' });
      }
      await supabase
        .from('logs')
        .update({ assignedTo: username })
        .eq('subdomain', subdomain);
    } else if (action === 'terminate') {
      if (!username) {
        return res.status(400).json({ message: 'Missing username for terminate action' });
      }

      await supabase
        .from('logs')
        .update({
          terminatedBy: username,
          terminationTime: new Date().toISOString(),
          status: 'terminated'
        })
        .eq('subdomain', subdomain);

      // 执行解绑
      const fullDomain = `${subdomain}.buttonofdictator.xyz`;
      const response = await fetch(`https://api.vercel.com/v9/projects/button-of-dictator/aliases/${fullDomain}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const unlinkResult = await response.json();

      if (!response.ok) {
        console.error('Vercel unlink error:', unlinkResult);
        return res.status(500).json({ message: 'Unlink failed', detail: unlinkResult });
      }
    } else {
      return res.status(400).json({ message: 'Invalid action type' });
    }

    return res.status(200).json({ message: 'Update successful' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Update failed', error: error.message });
  }
}
