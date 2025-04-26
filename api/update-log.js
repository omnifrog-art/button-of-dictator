import { createClient } from '@supabase/supabase-js';

// 用你的Supabase配置替换下面两行
const SUPABASE_URL = 'https://qvslxmokvbjhslbxdhtb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c2x4bW9rdmJqaHNsYnhkaHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTY4MzUzNiwiZXhwIjoyMDYxMjU5NTM2fQ.6d7NbQZx_s3PMFrbKK945u2N1WDOYIXW6W4BdDYwpj8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const host = req.headers.host;
  let subdomain = null;

  if (host.endsWith('buttonofdictator.xyz')) {
    subdomain = host.replace('.buttonofdictator.xyz', '');
  }

  const { username, action } = req.body;

  if (!subdomain || !action) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    if (action === 'access') {
      // 访问页面，更新 status
      await supabase
        .from('logs')
        .update({ status: 'accessed' })
        .eq('subdomain', subdomain);
    } else if (action === 'assign') {
      // 提交用户名，更新 assignedTo
      if (!username) {
        return res.status(400).json({ message: 'Missing username for assign action' });
      }
      await supabase
        .from('logs')
        .update({ assignedTo: username })
        .eq('subdomain', subdomain);
    } else if (action === 'terminate') {
      // 点击按钮，更新终止相关字段
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
    } else {
      return res.status(400).json({ message: 'Invalid action type' });
    }

    return res.status(200).json({ message: 'Update successful' });

  } catch (error) {
    console.error('Supabase update error:', error);
    return res.status(500).json({ message: 'Update failed', error: error.message });
  }
}
