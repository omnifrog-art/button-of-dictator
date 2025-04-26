// log.js

const SUPABASE_URL = 'https://qvslxmokvbjhslbxdhtb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c2x4bW9rdmJqaHNsYnhkaHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1MzYsImV4cCI6MjA2MTI1OTUzNn0.fJ9jTo9yrKWZQ-Hif2-YJo5jWF1RolIsIeZSVB5TPxA';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadLogs() {
  const grid = document.getElementById('log-grid');
  const loading = document.getElementById('loading');

  try {
    // ⚡ 查询 logs 表，按 accessTime 升序排序
    const { data, error } = await db.from('logs').select('*').order('accessTime', { ascending: true });
    console.log('Fetched data:', data);

    if (error) throw error;

    loading.style.display = 'none';

    // ⚡ 过滤掉 pending 状态，只显示 accessed 和 terminated
    const activeLogs = data.filter(log => log.status !== 'pending');

    if (activeLogs.length === 0) {
      loading.innerText = 'No activities yet.';
      loading.style.display = 'block';
      return;
    }

    // ⚡ 遍历并渲染每个active记录
    activeLogs.forEach(log => {
      const card = document.createElement('div');
      card.className = 'card';

      const statusClass = log.status === 'terminated' ? 'executed' : 'accessed';

      card.innerHTML = `
        <div class="domain">${log.subdomain}<span class="suffix">.buttonofdictator.xyz</span></div>
        <div class="label">Assigned to:</div>
        <div class="value">${log.assignedTo || '-'}</div>

        <div class="label">Status:</div>
        <div class="value ${statusClass}">${log.status}</div>

        <div class="label">Termination triggered by:</div>
        <div class="value">${log.terminatedBy || '-'}</div>

        <div class="label">Time of termination:</div>
        <div class="value">${log.terminationTime ? new Date(log.terminationTime).toLocaleString() : '-'}</div>
      `;

      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load logs:', err);
    loading.innerText = 'Failed to load logs.';
  }
}

loadLogs();
