#!/usr/bin/env python3
# Refresh Pending Subdomains - Supabase Driven

import os
import requests
from datetime import datetime, timedelta, timezone

# 配置
SUPA_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPA_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Headers
def s_headers():
    return {
        "apikey": SUPA_KEY,
        "Authorization": f"Bearer {SUPA_KEY}",
        "Content-Type": "application/json"
    }

# 主流程
def main():
    if not SUPA_URL or not SUPA_KEY:
        print("❌ Missing Supabase env vars.")
        return

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=10)

    query = f"{SUPA_URL}/rest/v1/logs?select=id,status,accessTime,terminationTime&status=eq.accessed&terminationTime=is.null"
    try:
        resp = requests.get(query, headers=s_headers(), timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"❌ Error fetching logs: {e}")
        return

    stale_ids = []
    for entry in data:
        access_time = entry.get("accessTime")
        if access_time:
            standardized_time = access_time.replace(' ', 'T').replace('+00', '+00:00')
            access_dt = datetime.fromisoformat(standardized_time)

            if access_dt < cutoff:
                stale_ids.append(entry['id'])

    if not stale_ids:
        print(f"[{now.isoformat()}] ✓ No stale subdomains found.")
        return

    print(f"[{now.isoformat()}] ↺ Resetting {len(stale_ids)} stale subdomains...")

    patch_url = f"{SUPA_URL}/rest/v1/logs?id=in.({','.join(map(str, stale_ids))})"
    payload = {
        "status": "pending",
        "accessTime": None,
        "assignedTo": None  # ✅ 清空用户名
    }

    try:
        patch_resp = requests.patch(patch_url, headers=s_headers(), json=payload, timeout=15)
        patch_resp.raise_for_status()
        print(f"✓ Successfully reset {len(stale_ids)} subdomains.")
    except Exception as e:
        print(f"❌ Error resetting subdomains: {e}")

if __name__ == "__main__":
    main()
