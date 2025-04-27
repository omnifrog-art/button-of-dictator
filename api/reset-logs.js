// /api/reset-logs.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    // 只重置 status 是 accessed 或 terminated 的记录！
    const { error } = await supabase
      .from('logs')
      .update({
        status: 'pending',
        assignedTo: null,
        terminatedBy: null,
        terminationTime: null,
        accessTime: null
      })
      .in('status', ['accessed', 'terminated']); // 👈 只操作这些

    if (error) throw error;

    return res.status(200).json({ message: 'All applicable logs reset successfully' });
  } catch (err) {
    console.error('Reset logs error:', err);
    return res.status(500).json({ message: 'Failed to reset logs', error: err.message });
  }
}
