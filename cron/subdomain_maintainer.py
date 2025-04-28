#!/usr/bin/env python3
"""
 Sub-domain Maintainer  –  button-of-dictator
 …其余说明保持不变…
"""

import os, random, string, sys, time, requests
from datetime import datetime
from typing import Set

# ── 配置常量（保持与你原先一致） ──────────────────────────────────────────
VERCEL_TOKEN   = os.getenv("VERCEL_TOKEN")
PROJECT_NAME   = "button-of-dictator"
TEAM_ID        = "team_LHRnPMHxhfAzlvjJ2KGScARX"

SUPA_URL       = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPA_KEY       = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

ROOT_DOMAIN    = "buttonofdictator.xyz"
LOG_DOMAIN     = f"log.{ROOT_DOMAIN}"
TARGET_COUNT   = 48

# ── headers helper ──────────────────────────────────────────────────────
def v_headers():
    return {"Authorization": f"Bearer {VERCEL_TOKEN}", "Content-Type": "application/json"}

def s_headers():
    return {"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}", "Content-Type": "application/json"}

# ── ★★★ 100% 获取全部 Vercel 域名（支持分页） ★★★ ────────────────────────
def vercel_domains() -> Set[str]:
    base = f"https://api.vercel.com/v9/projects/{PROJECT_NAME}/domains"
    url  = f"{base}?teamId={TEAM_ID}&limit=100"      # 第一页拉 100，已覆盖上限
    domains = set()

    while url:
        resp = requests.get(url, headers=v_headers(), timeout=15)
        resp.raise_for_status()
        body = resp.json()

        # 收集本页
        domains.update(d["name"] for d in body.get("domains", []))

        # 跟随 pagination.next，如果没有就 None 循环结束
        url = body.get("pagination", {}).get("next")

    return domains

# ── Supabase helpers（与你原版相同） ─────────────────────────────────────
def supa_subs() -> Set[str]:
    url = f"{SUPA_URL}/rest/v1/logs?select=subdomain"
    rows = requests.get(url, headers=s_headers(), timeout=15).json()
    return {r["subdomain"] for r in rows}

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
    requests.post(url, json=payload, headers=s_headers(), timeout=15).raise_for_status()

def add_vercel(sub: str) -> bool:
    url = f"https://api.vercel.com/v9/projects/{PROJECT_NAME}/domains?teamId={TEAM_ID}"
    body = {"name": f"{sub}.{ROOT_DOMAIN}"}
    return requests.post(url, json=body, headers=v_headers(), timeout=15).ok

# ── 主流程（其余与之前相同，末尾加 sys.exit(0)） ──────────────────────
def rnd_id(n: int = 5) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))

def main():
    if not all([VERCEL_TOKEN, SUPA_URL, SUPA_KEY]):
        sys.exit("❌  Missing env vars.")

    v_set = vercel_domains()
    s_set = supa_subs()

    trigger_live = {d.split('.')[0] for d in v_set if d not in {ROOT_DOMAIN, LOG_DOMAIN}}
    need = TARGET_COUNT - len(trigger_live)

    print(f"[{datetime.utcnow().isoformat()}] live={len(trigger_live)}  need={need}")

    if need <= 0:
        print("✓  pool full, nothing to add."); sys.exit(0)

    existing = s_set | trigger_live
    added = 0; attempts = 0

    while added < need and attempts < 200:
        attempts += 1
        sub = rnd_id()
        if sub in existing:
            continue
        if add_vercel(sub):
            insert_supa(sub)
            existing.add(sub)
            added += 1
            print(f"  + {sub}.{ROOT_DOMAIN}")
        else:
            print(f"  ! failed {sub}")
            time.sleep(1)

    print(f"✓  Added {added} new sub-domains, done.")
    sys.exit(0)   # ← 保证 Job 立即结束

if __name__ == "__main__":
    main()
