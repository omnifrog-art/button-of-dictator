import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const host = req.headers.host;
    if (!host || !host.endsWith('buttonofdictator.xyz')) {
      return res.status(400).json({ message: 'Invalid host' });
    }

    const subdomain = host.replace('.buttonofdictator.xyz', '');
    const fullDomain = `${subdomain}.buttonofdictator.xyz`;

    console.log('Trying to remove domain:', fullDomain);

    const response = await fetch(`https://api.vercel.com/v6/domains/${fullDomain}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Vercel remove domain error:', result);
      return res.status(response.status).json({ message: 'Vercel remove failed', details: result });
    }

    console.log('Domain removed successfully:', result);
    return res.status(200).json({ message: 'Domain successfully removed' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
