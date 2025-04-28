export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  const host = req.headers.host || '';
  if (!host.endsWith('.buttonofdictator.xyz')) {
    return res.status(400).json({ message: 'Invalid domain' });
  }

  const subdomain = host.replace('.buttonofdictator.xyz', '');
  const fullDomain = `${subdomain}.buttonofdictator.xyz`;

  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  const PROJECT_NAME = 'button-of-dictator';
  const TEAM_ID = 'team_LHRnPMHxhfAzlvjJ2KGScARX';

  try {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_NAME}/domains/${fullDomain}?teamId=${TEAM_ID}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 404) {
      // 域名不存在了，确认被删除
      return res.status(200).json({ exists: false });
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('Domain check error:', data);
      return res.status(response.status).json({ message: 'Domain check failed', detail: data });
    }

    // 如果还能查到，说明域名还在
    return res.status(200).json({ exists: true });

  } catch (error) {
    console.error('Domain check API error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
