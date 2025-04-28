#!/usr/bin/env python3
"""
Sub-domain Maintainer  ·  button-of-dictator
────────────────────────────────────────────
• 保持 48 个 trigger 子域 (随机46 + 00000 + 00sam)
• 忽略根域  buttonofdictator.xyz  和  log.buttonofdictator.xyz
• 池子不足时自动生成新 5 位随机子域，挂到 Vercel + 写入 Supabase(logs)

把本脚本放进仓库  cron/  目录，
用 GitHub Actions（或其他 CRON）定时调用即可。
"""

import os, random, string, sys, time
import requests
from datetime import datetime
from typing import Set

# ── 1. 环境变量 ─────────────────────────────────────────────────────────
VERCEL_TOKEN   = os.getenv("VERCEL_TOKEN")                 # team-scoped
PROJECT_NAME   = "button-of-dictator"
TEAM_ID        = "team_LHRnPMHxhfAzlvjJ2KGScARX"

SUPA_URL       = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPA_KEY       = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

ROOT_DOMAIN    = "buttonofdictator.xyz"
LOG_DOMAIN     = f"log.{ROOT_DOMAIN}"
TARGET_COUNT   = 48                                        # 只计算 trigger

# ── 2. 一些小工具 ───────────────────────────────────────────────────────
def rnd_id(n: int = 5) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))

def v_headers():
    return {"Authorization": f"Bearer {VERCEL_TOKEN}", "Content-Type": "application/json"}

def s_headers():
    return {"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}", "Content-Type": "application/json"}

# ── 3. Vercel 读写 ──────────────────────────────────────────────────────
def vercel_domains() -> Set[str]:
    url = f"https://api.vercel.com/v9/projects/{PROJECT_NAME}/domains?teamId={TEAM_ID}"
    data = requests.get(url, headers=v_headers(), timeout=20).json().get("domains", [])
    return {d["name"] for d in data}

def add_vercel(sub: str) -> bool:
    url = f"https://api.vercel.com/v9/projects/{PROJECT_NAME}/domains?teamId={TEAM_ID}"
    body = {"name": f"{sub}.{ROOT_DOMAIN}"}
    r = requests.post(url, json=body, headers=v_headers(), timeout=20)
    return r.ok

# ── 4. Supabase 读写（直接表端点） ───────────────────────────────────────
def supa_subs() -> Set[str]:
    url = f"{SUPA_URL}/rest/v1/logs?select=subdomain"
    rows = requests.get(url, headers=s_headers(), timeout=20).json()
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
    requests.post(url, json=payload, headers=s_headers(), timeout=20).raise_for_status()

# ── 5. 主流程 ───────────────────────────────────────────────────────────
def main():
    if not (VERCEL_TOKEN and SUPA_URL and SUPA_KEY):
        sys.exit("❌  环境变量缺失 (VERCEL_TOKEN / SUPABASE keys)。")

    v_set = vercel_domains()
    s_set = supa_subs()

    trigger_live = {d.split('.')[0] for d in v_set if d not in {ROOT_DOMAIN, LOG_DOMAIN}}
    need = TARGET_COUNT - len(trigger_live)

    print(f"[{datetime.utcnow().isoformat()}] live={len(trigger_live)}  need={need}")

    if need <= 0:
        print("✓  池子已满，无需补充")
        return

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
            print(f"  + {sub}.{ROOT_DOMAIN}  已添加")
        else:
            print(f"  ! 添加 {sub} 失败，重试")
            time.sleep(1)

    print(f"✓  共补充 {added} 个子域，结束")

if __name__ == "__main__":
    main()
