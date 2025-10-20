// log.js

const SUPABASE_URL = 'https://qvslxmokvbjhslbxdhtb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c2x4bW9rdmJqaHNsYnhkaHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1MzYsImV4cCI6MjA2MTI1OTUzNn0.fJ9jTo9yrKWZQ-Hif2-YJo5jWF1RolIsIeZSVB5TPxA';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadLogs() {
  const grid = document.getElementById('log-grid');
  const loading = document.getElementById('loading');

  try {
    // 从 Supabase 获取所有日志
    const { data, error } = await db.from('logs').select('*');
    console.log('Fetched data:', data);

    if (error) throw error;

    // 隐藏 Loading
    loading.style.display = 'none';

    // 过滤掉 pending 状态
    const rows = (data || []).filter(log => log.status !== 'pending');

    if (rows.length === 0) {
      loading.innerText = 'No activities yet.';
      loading.style.display = 'block';
      return;
    }

    // ---- 排序逻辑 --------------------------------------------------
    // 1️⃣ 计算时间戳（terminationTime 或 accessTime）
    const ts = (log) => {
      const s = log.terminationTime || log.accessTime || 0;
      const n = Date.parse(s);
      return Number.isNaN(n) ? 0 : n;
    };

    // 2️⃣ 排序规则：
    //    - 有时间戳的记录（terminated 或 accessed）→ 按时间降序排列
    //    - accessed 且没有时间戳的记录 → 放最后
    rows.sort((a, b) => {
      const aHasTime = !!(a.terminationTime || a.accessTime);
      const bHasTime = !!(b.terminationTime || b.accessTime);

      // 无时间戳的 accessed 放最后
      if (!aHasTime && a.status === 'accessed' && (bHasTime || b.status !== 'accessed')) return 1;
      if (!bHasTime && b.status === 'accessed' && (aHasTime || a.status !== 'accessed')) return -1;

      // 其余情况：按时间新→旧
      return ts(b) - ts(a);
    });
    // ----------------------------------------------------------------

    // 清空旧内容再渲染
    grid.innerHTML = '';

    // 渲染每条记录
    rows.forEach(log => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.subdomain = log.subdomain || '';

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
        <div class="value">${
          log.terminationTime ? new Date(log.terminationTime).toLocaleString() : '-'
        }</div>
      `;

      grid.appendChild(card);
    });

  } catch (err) {
    console.error('Failed to load logs:', err);
    loading.innerText = 'Failed to load logs.';
    loading.style.display = 'block';
  }
}

loadLogs();
