"""
scripts/build_giphy_cache.py
============================================================
Single consolidated build script for the Gaze Economy Giphy data cache.
Replaces scripts/01_giphy_probe.py + scripts/02_process_results.py.

Produces:
  data/keywords.enriched.json   — client-served artifact (55 keywords + 6 fixed_gifs)
  data/summary.csv              — flat CSV for inspection

Runtime cost:
  - 55 search calls (one per unique taxonomy term) — throttled 150ms
  - 1 by-id call that resolves all 6 PRD v2 hardcoded GIFs in one request
  Total: 56 Giphy API requests. Stays well under free-tier 100/hour.

Usage (local):
  1. .env with GIPHY_API_KEY=...
  2. pip install requests python-dotenv
  3. python scripts/build_giphy_cache.py

Usage (CI): .github/workflows/refresh-giphy-cache.yml injects GIPHY_API_KEY
from repo secrets, runs this script, commits any diff.
============================================================
"""

import csv
import json
import math
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

GIPHY_API_KEY = os.getenv("GIPHY_API_KEY")
if not GIPHY_API_KEY:
    sys.exit("ERROR: GIPHY_API_KEY not set (check .env or CI secret)")

SEARCH_URL = "https://api.giphy.com/v1/gifs/search"
BYID_URL   = "https://api.giphy.com/v1/gifs"
DELAY_SEC  = 0.15
RATING     = "pg"
LANG       = "en"
BUNDLE     = "messaging_non_clips"
FIELDS     = "id,images.fixed_width,images.fixed_width_small,images.fixed_width_still,analytics"

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR  = REPO_ROOT / "data"

DISTRICT_OF = {
    "selfie": 1, "influencer": 1, "viral": 1, "scrolling": 1, "attention": 1, "meme": 1,
    "coronavirus": 2, "covid": 2, "pandemic": 2, "vaccine": 2, "variant": 2,
    "long covid": 2, "flatten the curve": 2,
    "lockdown": 3, "quarantine": 3, "social distancing": 3, "stay home": 3,
    "work from home": 3, "essential worker": 3, "quarantine life": 3,
    "loneliness": 4, "anxiety": 4, "boredom": 4, "depression": 4, "hopeless": 4,
    "burnout": 4, "zoom fatigue": 4, "pandemic fatigue": 4, "fear": 4, "panic": 4,
    "isolation": 4,
    "misinformation": 5, "conspiracy": 5, "censorship": 5, "protest": 5, "fake news": 5,
    "deepfake": 6, "metaverse": 6, "AI": 6, "reality": 6, "simulation": 6,
    "surveillance": 6, "new normal": 6,
    "doomscrolling": 7, "cabin fever": 7, "disconnected": 7, "zoom": 7,
    "zoom memes": 7, "return to office": 7,
    "hope": 8, "together": 8, "self care": 8, "cope": 8, "mental health": 8,
}

DISTRICT_NAMES = {
    1: "The Screen", 2: "The Body", 3: "Control", 4: "Inner Life",
    5: "Power & Voice", 6: "The Simulation", 7: "The Cage", 8: "Respite",
}

FIXED_GIF_IDS = {
    "order_i":            "34UoAM268FUBO",
    "order_ii":           "tgKHdTYy9banoikIDF",
    "order_iii":          "dQQCbebNkTXqdC5EJ6",
    "order_iv":           "lXiRKE65Qp4sMrXgc",
    "closing_together":   "34UoAM268FUBO",
    "closing_loneliness": "ISOckXUybVfQ4",
}


def classify_keyword(term, anchors):
    if term in anchors.get("cage_keywords", []):    return "cage"
    if term in anchors.get("respite_keywords", []): return "respite"
    if term in anchors.get("baudrillard", []):      return "simulacra"
    if term in anchors.get("mcluhan", []):          return "medium"
    return "neutral"


def log_normalise(values):
    logs = [math.log1p(v) for v in values]
    lo, hi = min(logs), max(logs)
    if hi == lo:
        return [50.0] * len(logs)
    return [round((v - lo) / (hi - lo) * 100, 2) for v in logs]


def extract_gif(gif_obj):
    if not gif_obj:
        return None
    imgs = gif_obj.get("images", {}) or {}
    fw   = imgs.get("fixed_width", {}) or {}
    fws  = imgs.get("fixed_width_small", {}) or {}
    fwst = imgs.get("fixed_width_still", {}) or {}
    analytics_obj = gif_obj.get("analytics", {}) or {}
    onload = (analytics_obj.get("onload") or {}).get("url", "")
    return {
        "id":          gif_obj.get("id", ""),
        "webp":        fw.get("webp", "") or fw.get("url", ""),
        "mp4":         fw.get("mp4", ""),
        "still":       fwst.get("url", ""),
        "small":       fws.get("url", "") or fws.get("webp", ""),
        "onload_ping": onload,
    }


def fetch_search(term):
    params = {
        "api_key": GIPHY_API_KEY,
        "q":       term,
        "limit":   1,
        "rating":  RATING,
        "lang":    LANG,
        "bundle":  BUNDLE,
        "fields":  FIELDS,
    }
    r = requests.get(SEARCH_URL, params=params, timeout=15)
    r.raise_for_status()
    return r.json()


def fetch_by_ids(ids):
    params = {
        "api_key": GIPHY_API_KEY,
        "ids":     ",".join(ids),
        "fields":  FIELDS,
    }
    r = requests.get(BYID_URL, params=params, timeout=15)
    r.raise_for_status()
    return r.json()


def build():
    print(f"[build_giphy_cache] start {datetime.now().isoformat()}")

    meta    = json.loads((DATA_DIR / "keywords.json").read_text())
    phases  = meta["phases"]
    anchors = meta.get("theory_anchors", {})

    unique_terms = []
    for phase in phases.values():
        for kw in phase["keywords"]:
            if kw["term"] not in unique_terms:
                unique_terms.append(kw["term"])

    print(f"[search] fetching {len(unique_terms)} unique terms")
    term_data = {}
    for i, term in enumerate(unique_terms, 1):
        try:
            js = fetch_search(term)
            total_count = js.get("pagination", {}).get("total_count", 0)
            gif_list    = js.get("data", []) or []
            gif         = extract_gif(gif_list[0]) if gif_list else None
            term_data[term] = {"total_count": total_count, "gif": gif}
            print(f"  [{i:02d}/{len(unique_terms)}] {term!r:<22} total_count={total_count:>8,}")
        except Exception as exc:
            print(f"  [{i:02d}/{len(unique_terms)}] {term!r:<22} FAILED: {exc}")
            term_data[term] = {"total_count": 0, "gif": None}
        time.sleep(DELAY_SEC)

    print(f"[by-id] fetching {len(set(FIXED_GIF_IDS.values()))} fixed GIFs")
    unique_ids    = list(dict.fromkeys(FIXED_GIF_IDS.values()))
    fixed_by_id   = {}
    try:
        js = fetch_by_ids(unique_ids)
        for gif_obj in js.get("data", []) or []:
            gid = gif_obj.get("id")
            if gid:
                fixed_by_id[gid] = extract_gif(gif_obj)
    except Exception as exc:
        print(f"  FAILED: {exc}")

    fixed_gifs_out = {}
    for slot, gid in FIXED_GIF_IDS.items():
        resolved = fixed_by_id.get(gid)
        if resolved:
            fixed_gifs_out[slot] = resolved
            print(f"  [ok]   {slot:<20} id={gid}")
        else:
            print(f"  [miss] {slot:<20} id={gid}  — retained as empty slot")
            fixed_gifs_out[slot] = {
                "id": gid, "webp": "", "mp4": "", "still": "", "small": "", "onload_ping": "",
            }

    counts_by_phase = {
        pk: [term_data.get(kw["term"], {}).get("total_count", 0) for kw in ph["keywords"]]
        for pk, ph in phases.items()
    }
    scores_by_phase = {pk: log_normalise(v) if v else [] for pk, v in counts_by_phase.items()}

    # keywords dict: one entry per UNIQUE term (54). Fields are phase-invariant.
    # For terms that appear in multiple phases (e.g. "loneliness"), the primary
    # entry reflects the term's stable metadata; per-phase codification scores
    # live in the `bubbles` array below.
    keywords_out = {}
    primary_phase = {}
    for pk, ph in phases.items():
        for kw in ph["keywords"]:
            primary_phase.setdefault(kw["term"], pk)

    for term, pk in primary_phase.items():
        data = term_data.get(term, {})
        district = DISTRICT_OF.get(term, 0)
        idx = phases[pk]["keywords"].index(next(k for k in phases[pk]["keywords"] if k["term"] == term))
        kw = phases[pk]["keywords"][idx]
        keywords_out[term] = {
            "term":               term,
            "primary_phase":      pk,
            "category":           kw["category"],
            "source":             kw["source"],
            "total_count":        data.get("total_count", 0),
            "codification_score": scores_by_phase[pk][idx],
            "classification":     classify_keyword(term, anchors),
            "district":           district,
            "district_name":      DISTRICT_NAMES.get(district, ""),
            "gif":                data.get("gif"),
        }

    # bubbles array: one entry per phase-instance (55). Drives the Strata View.
    # Each bubble references keywords[term].gif for its image data — no duplication.
    bubbles_out = []
    for pk, ph in phases.items():
        for idx, kw in enumerate(ph["keywords"]):
            bubbles_out.append({
                "term":               kw["term"],
                "phase":              pk,
                "category":           kw["category"],
                "classification":     classify_keyword(kw["term"], anchors),
                "codification_score": scores_by_phase[pk][idx],
                "total_count":        term_data.get(kw["term"], {}).get("total_count", 0),
            })

    phases_out = {}
    for pk, ph in phases.items():
        counts = counts_by_phase[pk]
        phases_out[pk] = {
            "label":            ph["label"],
            "years":            ph["years"],
            "narrative":        ph["narrative"],
            "keyword_terms":    [kw["term"] for kw in ph["keywords"]],
            "phase_max_count":  max(counts) if counts else 0,
            "phase_min_count":  min(counts) if counts else 0,
        }

    enriched = {
        "fetched_at":     int(time.time() * 1000),
        "schema_version": 2,
        "keywords":       keywords_out,
        "bubbles":        bubbles_out,
        "phases":         phases_out,
        "fixed_gifs":     fixed_gifs_out,
    }

    out_json = DATA_DIR / "keywords.enriched.json"
    out_json.write_text(json.dumps(enriched, indent=2))
    print(f"[write] {out_json.relative_to(REPO_ROOT)} ({out_json.stat().st_size:,} bytes)")

    csv_path = DATA_DIR / "summary.csv"
    with csv_path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "phase", "phase_label", "years", "term", "category",
            "total_count", "codification_score", "classification", "district",
        ])
        writer.writeheader()
        for pk, ph in phases.items():
            for idx, kw in enumerate(ph["keywords"]):
                term = kw["term"]
                writer.writerow({
                    "phase":              pk,
                    "phase_label":        ph["label"],
                    "years":              ph["years"],
                    "term":               term,
                    "category":           kw["category"],
                    "total_count":        term_data.get(term, {}).get("total_count", 0),
                    "codification_score": scores_by_phase[pk][idx],
                    "classification":     classify_keyword(term, anchors),
                    "district":           DISTRICT_OF.get(term, 0),
                })
    print(f"[write] {csv_path.relative_to(REPO_ROOT)}")

    print(f"[build_giphy_cache] done  {datetime.now().isoformat()}")


if __name__ == "__main__":
    build()
