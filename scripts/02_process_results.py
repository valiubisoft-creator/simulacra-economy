"""
SCRIPT 02 — PROCESS & NORMALISE RESULTS
=========================================
Purpose: Take the raw giphy_results.json and produce two clean outputs:

  1. data/dataset.json       — The structured dataset for the game/vis.
                               Includes normalised codification scores,
                               phase metadata, and cage/respite classification.

  2. data/summary.csv        — A flat CSV for quick inspection in a spreadsheet.
                               Useful for spotting outliers before building.

What it computes:
  - codification_score    : giphy_total_count normalised 0–100 within each phase
  - log_score             : log-normalised version (better for skewed Giphy counts)
  - cage_or_respite       : based on theory_anchors in keywords.json
  - density_label         : "deep" / "medium" / "shallow" codification bucket

Usage:
  python scripts/02_process_results.py
  (Run after 01_giphy_probe.py has completed)
"""

import json
import csv
import math
from pathlib import Path

def load_json(path):
    with open(path, "r") as f:
        return json.load(f)

def log_normalise(values: list[float]) -> list[float]:
    """Log-normalise a list of values to 0–100. Handles zeros."""
    log_vals = [math.log1p(v) for v in values]
    min_v, max_v = min(log_vals), max(log_vals)
    if max_v == min_v:
        return [50.0 for _ in log_vals]
    return [round((v - min_v) / (max_v - min_v) * 100, 2) for v in log_vals]

def linear_normalise(values: list[float]) -> list[float]:
    """Linear normalise to 0–100."""
    min_v, max_v = min(values), max(values)
    if max_v == min_v:
        return [50.0 for _ in values]
    return [round((v - min_v) / (max_v - min_v) * 100, 2) for v in values]

def density_label(score: float) -> str:
    if score >= 70:
        return "deep"
    elif score >= 35:
        return "medium"
    else:
        return "shallow"

def classify_keyword(term: str, theory_anchors: dict) -> str:
    """Check if a keyword belongs to cage or respite theory anchors."""
    if term in theory_anchors.get("cage_keywords", []):
        return "cage"
    if term in theory_anchors.get("respite_keywords", []):
        return "respite"
    if term in theory_anchors.get("baudrillard", []):
        return "simulacra"
    if term in theory_anchors.get("mcluhan", []):
        return "medium"
    return "neutral"

def process():
    raw = load_json("data/giphy_results.json")
    keywords_meta = load_json("data/keywords.json")
    theory_anchors = keywords_meta.get("theory_anchors", {})

    dataset = {
        "metadata": {
            **raw["metadata"],
            "processed": True,
            "description": "Normalised Giphy codification density scores per keyword, per phase."
        },
        "phases": {}
    }

    all_rows = []  # For CSV export

    for phase_key, phase in raw["phases"].items():
        kws = phase["keywords"]
        if not kws:
            continue

        counts = [k["giphy_total_count"] for k in kws]
        log_scores = log_normalise(counts)
        linear_scores = linear_normalise(counts)

        processed_keywords = []
        for i, kw in enumerate(kws):
            term = kw["term"]
            entry = {
                "term": term,
                "category": kw["category"],
                "source": kw["source"],
                "giphy_total_count": kw["giphy_total_count"],
                "codification_score": log_scores[i],     # Primary vis metric
                "linear_score": linear_scores[i],
                "density_label": density_label(log_scores[i]),
                "classification": classify_keyword(term, theory_anchors),
                "rating_distribution": kw.get("rating_distribution", {}),
                "sample_gif_count": len(kw.get("gifs", [])),
                # Keep 3 preview GIFs for the game/vis to use
                "preview_gifs": [
                    {
                        "id": g["id"],
                        "preview_url": g["images"]["preview"],
                        "original_url": g["images"]["original"],
                        "title": g["title"]
                    }
                    for g in kw.get("gifs", [])[:3]
                ]
            }
            processed_keywords.append(entry)

            # Add to CSV rows
            all_rows.append({
                "phase": phase_key,
                "phase_label": phase["label"],
                "years": phase["years"],
                "term": term,
                "category": kw["category"],
                "giphy_total_count": kw["giphy_total_count"],
                "codification_score": log_scores[i],
                "density_label": density_label(log_scores[i]),
                "classification": classify_keyword(term, theory_anchors)
            })

        # Sort by codification score descending within each phase
        processed_keywords.sort(key=lambda x: x["codification_score"], reverse=True)

        dataset["phases"][phase_key] = {
            "label": phase["label"],
            "years": phase["years"],
            "narrative": phase["narrative"],
            "phase_max_count": max(counts),
            "phase_min_count": min(counts),
            "keywords": processed_keywords
        }

    # Save dataset.json
    with open("data/dataset.json", "w") as f:
        json.dump(dataset, f, indent=2)
    print("✓ Saved: data/dataset.json")

    # Save summary CSV
    if all_rows:
        fieldnames = list(all_rows[0].keys())
        with open("data/summary.csv", "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_rows)
        print("✓ Saved: data/summary.csv")

    # Print a quick diagnostic
    print("\n--- QUICK SUMMARY ---")
    for phase_key, phase in dataset["phases"].items():
        kws = phase["keywords"]
        print(f"\n{phase['label']} ({phase['years']})")
        print(f"  Keywords: {len(kws)}")
        top3 = kws[:3]
        bottom3 = kws[-3:]
        print(f"  Most codified:  {[k['term'] for k in top3]}")
        print(f"  Least codified: {[k['term'] for k in bottom3]}")

    print("\nDone.")

if __name__ == "__main__":
    process()
