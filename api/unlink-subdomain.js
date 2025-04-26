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
    return res.status(400).json({ message: 'Subdomain not found in request' });
  }

  const teamSlug = 'lomagistas-projects'; // 你的 Team 名
  const projectName = 'button-of-dictator'; // 你的项目名
  const fullDomain = `${subdomain}.buttonofdictator.xyz`;

  console.log('🔗 Attempting to unlink:', fullDomain);

  try {
    const response = await fetch(`https://api.vercel.com/v9/projects/${teamSlug}:${projectName}/aliases/${fullDomain}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const unlinkResult = await response.json();
    console.log('🔎 Vercel API response:', unlinkResult);

    if (!response.ok) {
      if (unlinkResult.error && unlinkResult.error.code === 'not_found') {
        console.warn('⚠️ Subdomain not found on Vercel. Treat as already unlinked.');
        return res.status(200).json({ message: 'Subdomain already not found (safe).' });
      }
      console.error('❌ Vercel unlink error:', unlinkResult);
      return res.status(500).json({ message: 'Unlink failed', detail: unlinkResult });
    }

    return res.status(200).json({ message: 'Unlink successful' });

  } catch (error) {
    console.error('🔥 Unlink API exception:', error);
    return res.status(500).json({ message: 'Unlink failed', error: error.message });
  }
}
