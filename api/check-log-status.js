import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, code: 'method_not_allowed', message: 'Only GET or POST allowed' });
  }

  const host = req.headers.host || '';
  if (!host.endsWith('.buttonofdictator.xyz')) {
    return res.status(400).json({ success: false, code: 'invalid_domain', message: 'Invalid domain' });
  }

  const subdomain = host.replace('.buttonofdictator.xyz', '');

  try {
    const { data, error } = await supabase
      .from('logs')
      .select('status')
      .eq('subdomain', subdomain)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Supabase log check error:', error);
      return res.status(500).json({ success: false, code: 'database_error', message: 'Database error', error: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, code: 'not_found', message: 'Log entry not found' });
    }

    return res.status(200).json({ success: true, status: data.status });

  } catch (err) {
    console.error('Check log status API error:', err);
    return res.status(500).json({ success: false, code: 'internal_error', message: 'Internal server error', error: err.message });
  }
}
