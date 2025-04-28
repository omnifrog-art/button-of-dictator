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
    const domainRes = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_NAME}/domains?teamId=${TEAM_ID}`,
      {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const domainData = await domainRes.json();

    if (!domainRes.ok) {
      console.error('Vercel list domains error:', domainData);
      return res.status(domainRes.status).json({ message: 'Failed to list domains', detail: domainData });
    }

    // 查当前 subdomain 是否存在
    const exists = domainData.domains.some(d => d.name === fullDomain);

    return res.status(200).json({ exists });

  } catch (error) {
    console.error('Check subdomain error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
