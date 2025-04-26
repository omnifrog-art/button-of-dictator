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

  const fullDomain = `${subdomain}.buttonofdictator.xyz`;

  try {
    const response = await fetch(`https://api.vercel.com/v9/projects/button-of-dictator/aliases/${fullDomain}?teamId=lomagistas-projects`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 204) {
      return res.status(200).json({ message: 'Unlinked successfully' });
    } else {
      const errorData = await response.json();
      console.error('Vercel unlink error:', errorData);
      return res.status(response.status).json({ message: 'Unlink failed', error: errorData });
    }
  } catch (error) {
    console.error('Unlink request failed:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}
