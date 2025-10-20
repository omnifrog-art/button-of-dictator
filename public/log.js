// log.js

const SUPABASE_URL = 'https://qvslxmokvbjhslbxdhtb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c2x4bW9rdmJqaHNsYnhkaHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1MzYsImV4cCI6MjA2MTI1OTUzNn0.fJ9jTo9yrKWZQ-Hif2-YJo5jWF1RolIsIeZSVB5TPxA';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadLogs() {
  const grid = document.getElementById('log-grid');
  const loading = document.getElementById('loading');

  try {
    // 取全量记录（去掉服务端排序）
    const { data, error } = await db.from('logs').select('*');
    console.log('Fetched data:', data);

    if (error) throw error;

    loading.style.display = 'none';

    // 只显示 accessed / terminated
    const rows = (data || []).filter(log => log.status !== 'pending');

    if (rows.length === 0) {
      loading.innerText = 'No activities yet.';
      loading.style.display = 'block';
      return;
    }

    // 排序规则：
    // 1) 有时间戳(terminationTime 或 accessTime) → 按时间新→旧
    // 2) accessed 且没有时间戳 → 放最后
    const getTs = (log) => {
      const s = log.terminationTime || log.accessTime || null;
      const n = s ? new Date(s).getTime() : NaN;
      return Number.isFinite(n) ? n : NaN;
    };
    const hasTs = (log) => Number.isFinite(getTs(log));

    rows.sort((a, b) => {
      const aHas = hasTs(a);
      const bHas = hasTs(b);

      // 只有“accessed 无时间戳”要放到最后
      const aIsNoTimeAccessed = !aHas && a.status === 'accessed';
      const bIsNoTimeAccessed = !bHas && b.status === 'accessed';
      if (aIsNoTimeAccessed !== bIsNoTimeAccessed) {
        return aIsNoTimeAccessed ? 1 : -1; // a 落后 / a 靠前
      }

      // 其他情况：按时间戳降序（新→旧）
      const ta = getTs(a);
      const tb = getTs(b);
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });

    // 按排好序的 rows 渲染
    rows.forEach(log => {
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
