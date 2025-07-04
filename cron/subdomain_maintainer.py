#!/usr/bin/env python3
# Sub-domain Maintainer - Supabase driven (稳定版)

import os, random, string, sys, time, requests
from datetime import datetime

# --- 配置常量 ---
VERCEL_TOKEN   = os.getenv("VERCEL_TOKEN")
PROJECT_NAME   = "button-of-dictator"
TEAM_ID        = "team_LHRnPMHxhfAzlvjJ2KGScARX"

SUPA_URL       = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPA_KEY       = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

ROOT_DOMAIN    = "buttonofdictator.xyz"
TARGET_COUNT   = 48

# --- Headers Helpers ---
def v_headers():
    return {"Authorization": f"Bearer {VERCEL_TOKEN}", "Content-Type": "application/json"}

def s_headers():
    return {"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}", "Content-Type": "application/json"}

# --- Supabase 拉全 logs ---
def fetch_all_logs() -> list:
    url = f"{SUPA_URL}/rest/v1/logs?select=subdomain,status"
    resp = requests.get(url, headers=s_headers(), timeout=15)
    resp.raise_for_status()
    return resp.json()

# --- 插入新记录到 Supabase ---
def insert_supa(sub: str):
    url = f"{SUPA_URL}/rest/v1/logs"
    payload = {
        "subdomain": sub,
        "status": "pending",
        "assignedTo": None,
        "terminatedBy": None,
        "terminationTime": None,
        "accessTime": None
    }
    resp = requests.post(url, json=payload, headers=s_headers(), timeout=15)
    resp.raise_for_status()

# --- 添加子域名到 Vercel ---
def add_vercel(sub: str) -> bool:
    url = f"https://api.vercel.com/v9/projects/{PROJECT_NAME}/domains?teamId={TEAM_ID}"
    body = {"name": f"{sub}.{ROOT_DOMAIN}"}
    resp = requests.post(url, json=body, headers=v_headers(), timeout=15)
    return resp.ok

# --- 生成随机子域名 ---
def rnd_id(n: int = 5) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))

# --- 主流程 ---
def main():
    if not all([VERCEL_TOKEN, SUPA_URL, SUPA_KEY]):
        sys.exit("❌ Missing env vars.")

    logs = fetch_all_logs()

    active_subs = {r['subdomain'] for r in logs if r.get('status') != 'terminated'}
    all_subs    = {r['subdomain'] for r in logs}

    live_count = len(active_subs)
    need_count = TARGET_COUNT - live_count

    print(f"[{datetime.utcnow().isoformat()}] live={live_count}  need={need_count}")

    if need_count <= 0:
        print("✓ Pool full, nothing to add.")
        sys.exit(0)

    added = 0
    attempts = 0

    while added < need_count and attempts < 200:
        attempts += 1
        sub = rnd_id()
        if sub in all_subs:
            continue
        if add_vercel(sub):
            insert_supa(sub)
            all_subs.add(sub)
            added += 1
            print(f"  + {sub}.{ROOT_DOMAIN}")
        else:
            print(f"  ! Failed {sub}")
            time.sleep(1)

    print(f"✓ Added {added} new sub-domains, done.")
    sys.exit(0)

if __name__ == "__main__":
    main()
