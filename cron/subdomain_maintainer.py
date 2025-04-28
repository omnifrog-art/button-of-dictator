#!/usr/bin/env python3
"""
Sub-domain Maintainer for button-of-dictator
- keeps 48 trigger sub-domains alive
- ignores root and log sub-domains
- adds fresh random 5-char sub-domains when pool < 48
"""

import os, random, string, sys, time, json
import requests
from datetime import datetime
from typing import List, Set

# ── 1. CONFIG  ──────────────────────────────────────────────────────────
VERCEL_TOKEN   = os.getenv("VERCEL_TOKEN")              # team-scoped token
PROJECT_NAME   = "button-of-dictator"
TEAM_ID        = "team_LHRnPMHxhfAzlvjJ2KGScARX"

SUPA_URL       = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPA_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

ROOT_DOMAIN    = "buttonofdictator.xyz"
LOG_DOMAIN     = f"log.{ROOT_DOMAIN}"
TARGET_COUNT   = 48                                     # only triggers

# ── 2. HELPERS  ─────────────────────────────────────────────────────────
def random_id(n: int = 5) -> str:
    chars = string.ascii_lowercase + string.digits
    return "".join(random.choices(chars, k=n))

def vercel_headers():
    return {
        "Authorization": f"Bearer {VERCEL_TOKEN}",
        "Content-Type": "application/json"
    }

def get_vercel_domains() -> Set[str]:
    url = f"https://api.vercel.com/v9/projects/{PROJECT_NAME}/domains?teamId={TEAM_ID}"
    r = requests.get(url, headers=vercel_headers(), timeout=20)
    r.raise_for_status()
    data = r.json().get("domains", [])
    return {d["name"] for d in data}

def add_vercel_domain(sub: str) -> bool:
    url = f"https://api.vercel.com/v9/projects/{PROJECT_NAME}/domains?teamId={TEAM_ID}"
    body = { "name": f"{sub}.{ROOT_DOMAIN}" }
    r = requests.post(url, headers=vercel_headers(), json=body, timeout=20)
    return r.ok

def supabase_rpc(sql: str, params=None):
    headers = {
        "apikey": SUPA_SERVICE_KEY,
        "Authorization": f"Bearer {SUPA_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    url = f"{SUPA_URL}/rest/v1/rpc/query"
    payload = { "query": sql, "params": params or {} }
    r = requests.post(url, json=payload, headers=headers, timeout=20)
    r.raise_for_status()
    return r.json()

def get_supa_subdomains() -> Set[str]:
    sql = "select subdomain from logs"
    rows = supabase_rpc(sql)
    return {row["subdomain"] for row in rows}

def insert_supa_sub(sub: str):
    iso = datetime.utcnow().isoformat()
    sql = """insert into logs(subdomain,status,assignedTo,terminatedBy,
             terminationTime,accessTime)
             values (:s,'pending',null,null,null,null)"""
    supabase_rpc(sql, {"s": sub})

# ── 3. MAIN LOGIC  ──────────────────────────────────────────────────────
def main():
    if not (VERCEL_TOKEN and SUPA_SERVICE_KEY and SUPA_URL):
        sys.exit("❌  Missing env vars (VERCEL_TOKEN / SUPABASE keys).")

    vercel_set = get_vercel_domains()
    supa_set   = get_supa_subdomains()

    # 过滤掉 root & log
    trigger_set = {d.split('.')[0] for d in vercel_set
                   if d not in {ROOT_DOMAIN, LOG_DOMAIN}}

    current = len(trigger_set)
    need    = TARGET_COUNT - current
    print(f"⇢  {current} triggers live | need {need} more")

    if need <= 0:
        print("✓  pool full, nothing to do.")
        return

    # pool of existing names to avoid duplicates
    existing = supa_set | trigger_set

    added = 0
    tries = 0
    while added < need and tries < 100:
        tries += 1
        sub = random_id()
        if sub in existing:
            continue
        # try add to Vercel
        if add_vercel_domain(sub):
            insert_supa_sub(sub)
            existing.add(sub)
            added += 1
            print(f"  + added {sub}.{ROOT_DOMAIN}")
        else:
            print(f"  ! failed to add {sub} (API error)")
            time.sleep(1)

    print(f"✓  Added {added} new sub-domains, done.")

if __name__ == "__main__":
    main()
