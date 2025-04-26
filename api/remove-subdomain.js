// /api/remove-subdomain.js

import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const host = req.headers.host;
  const subdomain = host.replace('.buttonofdictator.xyz', '');
  const fullDomain = `${subdomain}.buttonofdictator.xyz`;

  const VERCEL_TOKEN = process.env.VERCEL_TOKEN; // 你的token
  const PROJECT_NAME = 'button-of-dictator'; // 你的项目名，注意准确拼写！
  const TEAM_ID = 'team_LHRnPMHxhfAzlvjJ2KGScARX'; // 你的Team ID，刚刚确认过了

  try {
    const response = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_NAME}/domains/${fullDomain}?teamId=${TEAM_ID}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Vercel remove domain error:', data);
      return res.status(response.status).json({ message: 'Remove domain failed', detail: data });
    }

    console.log('Domain removed successfully:', fullDomain);
    return res.status(200).json({ message: 'Domain removed successfully' });

  } catch (error) {
    console.error('Domain remove error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
