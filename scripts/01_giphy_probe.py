"""
SCRIPT 01 — GIPHY CODIFICATION PROBE
======================================
Purpose: For each keyword in keywords.json, query the Giphy API
and record how thoroughly that concept has been "codified" into GIF culture.

What it measures:
  - total_count     : how many GIFs Giphy claims exist for this term
  - sample_gifs     : top 10 GIF IDs + URLs + titles for visual inspection
  - avg_rating      : content rating distribution (g, pg, pg-13, r)
  - trending_score  : whether this term appears in Giphy trending (bonus signal)

Output: data/giphy_results.json

Usage:
  pip install requests python-dotenv
  Add your Giphy API key to .env as GIPHY_API_KEY=your_key_here
  python scripts/01_giphy_probe.py

Get a free Giphy API key at: https://developers.giphy.com/
(Developer account, free tier allows 100 req/hour — more than enough)
"""

import json
import time
import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

GIPHY_API_KEY = os.getenv("GIPHY_API_KEY")
BASE_URL = "https://api.giphy.com/v1/gifs/search"
LIMIT = 25          # GIFs to fetch per keyword (Giphy max per request: 50)
SAMPLE_STORE = 10   # How many GIF records to save per keyword
DELAY = 0.8         # Seconds between requests (stay under rate limit)

def query_giphy(keyword: str) -> dict:
    """Query Giphy search endpoint for a keyword. Returns raw API response."""
    params = {
        "api_key": GIPHY_API_KEY,
        "q": keyword,
        "limit": LIMIT,
        "offset": 0,
        "rating": "pg-13",  # Keeps results clean enough for a public project
        "lang": "en"
    }
    try:
        r = requests.get(BASE_URL, params=params, timeout=10)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        print(f"  ERROR querying '{keyword}': {e}")
        return None

def extract_gif_data(gif: dict) -> dict:
    """Pull only what we need from each GIF object."""
    return {
        "id": gif.get("id"),
        "title": gif.get("title", ""),
        "url": gif.get("url", ""),
        "embed_url": gif.get("embed_url", ""),
        "rating": gif.get("rating", ""),
        "images": {
            "preview": gif.get("images", {}).get("fixed_height_small", {}).get("url", ""),
            "original": gif.get("images", {}).get("original", {}).get("url", ""),
            "width": gif.get("images", {}).get("original", {}).get("width", 0),
            "height": gif.get("images", {}).get("original", {}).get("height", 0),
        },
        "source_domain": gif.get("source_tld", ""),
        "import_datetime": gif.get("import_datetime", "")
    }

def probe_all_keywords():
    """Main loop — iterate all keywords across all phases."""
    
    if not GIPHY_API_KEY:
        raise ValueError("No GIPHY_API_KEY found. Add it to your .env file.")

    # Load keywords
    with open("data/keywords.json", "r") as f:
        keyword_data = json.load(f)

    results = {
        "metadata": {
            "queried_at": datetime.now().isoformat(),
            "giphy_limit_per_query": LIMIT,
            "total_keywords": 0
        },
        "phases": {}
    }

    total_keywords = 0

    for phase_key, phase in keyword_data["phases"].items():
        print(f"\n{'='*50}")
        print(f"PHASE: {phase['label']} ({phase['years']})")
        print(f"{'='*50}")

        results["phases"][phase_key] = {
            "label": phase["label"],
            "years": phase["years"],
            "narrative": phase["narrative"],
            "keywords": []
        }

        for kw_obj in phase["keywords"]:
            term = kw_obj["term"]
            print(f"  Querying: '{term}'...", end=" ", flush=True)

            response = query_giphy(term)
            if response is None:
                print("FAILED")
                continue

            pagination = response.get("pagination", {})
            gifs = response.get("data", [])

            # Giphy's `total_count` is capped at 5000 in their API
            # but is still a useful relative measure of codification density
            total_count = pagination.get("total_count", 0)
            count = pagination.get("count", 0)

            # Rating distribution in the sample
            ratings = {}
            for gif in gifs:
                r = gif.get("rating", "unknown")
                ratings[r] = ratings.get(r, 0) + 1

            result = {
                "term": term,
                "category": kw_obj["category"],
                "source": kw_obj["source"],
                "giphy_total_count": total_count,   # Codification density signal
                "giphy_sample_count": count,
                "rating_distribution": ratings,
                "gifs": [extract_gif_data(g) for g in gifs[:SAMPLE_STORE]]
            }

            results["phases"][phase_key]["keywords"].append(result)
            total_keywords += 1

            print(f"✓  total_count={total_count:,}")
            time.sleep(DELAY)

    results["metadata"]["total_keywords"] = total_keywords

    # Save results
    out_path = "data/datasets.json"
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n\nDone. {total_keywords} keywords queried.")
    print(f"Results saved to: {out_path}")

if __name__ == "__main__":
    probe_all_keywords()
