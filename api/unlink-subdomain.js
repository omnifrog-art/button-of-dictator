// /api/unlink-subdomain.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const host = req.headers.host;
  let subdomain = null;

  if (host.endsWith('buttonofdictator.xyz')) {
    subdomain = host.replace('.buttonofdictator.xyz', '');
  }

  if (!subdomain) {
    return res.status(400).json({ message: 'Subdomain not found' });
  }

  try {
    const fullDomain = `${subdomain}.buttonofdictator.xyz`;

    const response = await fetch(`https://api.vercel.com/v9/projects/lomagistas-projects:button-of-dictator/aliases/${fullDomain}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const unlinkResult = await response.json();

    if (!response.ok) {
      console.error('Vercel unlink error:', unlinkResult);
      return res.status(500).json({ message: 'Unlink failed', detail: unlinkResult });
    }

    return res.status(200).json({ message: 'Unlink successful' });

  } catch (error) {
    console.error('Unlink API error:', error);
    return res.status(500).json({ message: 'Unlink failed', error: error.message });
  }
}
