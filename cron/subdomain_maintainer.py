# cron/subdomain_maintainer.py (全新 Supabase 驱动版)

import os, random, string, sys, time, requests
from datetime import datetime

# --- 环境变量读取 ---
VERCEL_TOKEN   = os.getenv("VERCEL_TOKEN")
PROJECT_NAME   = "button-of-dictator"
TEAM_ID        = "team_LHRnPMHxhfAzlvjJ2KGScARX"

SUPA_URL       = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPA_KEY       = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

ROOT_DOMAIN    = "buttonofdictator.xyz"
TARGET_COUNT   = 48

# --- 辅助函数 ---
def v_headers():
    return {"Authorization": f"Bearer {VERCEL_TOKEN}", "Content-Type": "application/json"}

def s_headers():
    return {"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}", "Content-Type": "application/json"}

def supa_active_subs() -> set:
    url = f"{SUPA_URL}/rest/v1/logs?select=subdomain,status"
    resp = requests.get(url, headers=s_headers(), timeout=15)
    resp.raise_for_status()
    data = resp.json()
    return {r["subdomain"] for r in data if r["status"] != "terminated"}

def supa_all_subs() -> set:
    url = f"{SUPA_URL}/rest/v1/logs?select=subdomain"
    resp = requests.get(url, headers=s_headers(), timeout=15)
    resp.raise_for_status()
    data = resp.json()
    return {r["subdomain"] for r in data}

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

def add_vercel(sub: str) -> bool:
    url = f"https://api.vercel.com/v9/projects/{PROJECT_NAME}/domains?teamId={TEAM_ID}"
    body = {"name": f"{sub}.{ROOT_DOMAIN}"}
    resp = requests.post(url, json=body, headers=v_headers(), timeout=15)
    return resp.ok

def rnd_id(n: int = 5) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))

# --- 主程序 ---
def main():
    if not all([VERCEL_TOKEN, SUPA_URL, SUPA_KEY]):
        sys.exit("❌ Missing env vars.")

    active_subs = supa_active_subs()
    all_subs    = supa_all_subs()

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
