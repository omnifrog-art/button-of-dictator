import { createClient } from '@supabase/supabase-js';

// 从环境变量读取 Supabase 项目配置（⚡ 安全）
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 创建 Supabase 客户端（用service_role key）
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

  const { username, action } = req.body;

  if (!subdomain || !action) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    if (action === 'access') {
      // 初次访问trigger页面：标记accessed + 记录accessTime
      await supabase
        .from('logs')
        .update({
          status: 'accessed',
          accessTime: new Date().toISOString()
        })
        .eq('subdomain', subdomain);

    } else if (action === 'assign') {
      // 提交用户名
      if (!username) {
        return res.status(400).json({ message: 'Missing username for assign action' });
      }
      await supabase
        .from('logs')
        .update({ assignedTo: username })
        .eq('subdomain', subdomain);

    } else if (action === 'terminate') {
      // 点击终止按钮
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
