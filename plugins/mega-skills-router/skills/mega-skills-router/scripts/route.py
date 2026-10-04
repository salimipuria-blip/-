"""Route a request to matching skills; source_path is relative to this skill directory, path is absolute."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path


ALIASES = {
    "tarahi": "design", "طراحی": "design", "graphic": "design", "گرافیک": "design",
    "aks": "image", "عکس": "image", "تصویر": "image", "photo": "image",
    "tahlil": "analysis", "تحلیل": "analysis", "analyze": "analysis",
    "dade": "data", "داده": "data", "اطلاعات": "data",
    "excel": "excel", "اکسل": "excel", "spreadsheet": "excel",
    "site": "website", "سایت": "website", "وبسایت": "website", "web": "website",
    "mohtava": "content", "محتوا": "content", "content": "content",
    "foroosh": "sales", "فروش": "sales", "sale": "sales",
    "roshd": "growth", "رشد": "growth", "growth": "growth",
    "sakht": "create", "ساخت": "create", "بساز": "create", "create": "create",
    "virayesh": "edit", "ویرایش": "edit", "اصلاح": "edit",
    "video": "video", "ویدئو": "video", "ویدیو": "video",
    "instagram": "instagram", "اینستاگرام": "instagram",
    "prompt": "prompt", "پرامپت": "prompt",
    "agent": "agent", "ایجنت": "agent",
    "automation": "automation", "اتوماسیون": "automation", "خودکار": "automation",
    "browser": "browser", "مرورگر": "browser",
    "dashboard": "dashboard", "داشبورد": "dashboard",
    "code": "code", "کد": "code", "برنامه‌نویسی": "code", "برنامه نویسی": "code",
    "research": "research", "پژوهش": "research", "تحقیق": "research",
    "marketing": "marketing", "بازاریابی": "marketing",
    "business": "business", "کسب‌وکار": "business", "کسب و کار": "business",
    "travel": "travel", "سفر": "travel",
    "document": "document", "سند": "document",
    "presentation": "presentation", "ارائه": "presentation", "اسلاید": "presentation",
}
STOPWORDS = {"a", "an", "the", "for", "of", "to", "and", "va", "و", "در", "برای", "با", "از", "رو", "را"}
SKILL_DIR = Path(__file__).resolve().parents[1]
ARABIC_VARIANTS = str.maketrans({"ي": "ی", "ى": "ی", "ك": "ک"})


def _tokens(value: str) -> set[str]:
    normalized = unicodedata.normalize("NFKC", value).casefold().translate(ARABIC_VARIANTS)
    raw = re.findall(r"[\w]+", normalized, flags=re.UNICODE)
    return {ALIASES.get(token, token) for token in raw if token not in STOPWORDS and len(token) > 1}


def search_index(index_path: Path, query: str, min_score: float = 0.50) -> list[dict[str, object]]:
    payload = json.loads(index_path.read_text(encoding="utf-8"))
    query_tokens = _tokens(query)
    if not query_tokens:
        return []
    results: list[dict[str, object]] = []
    for skill in payload["skills"]:
        best_score = 0.0
        matched_trigger = ""
        for trigger in skill["triggers"]:
            trigger_tokens = _tokens(trigger)
            if not trigger_tokens:
                continue
            overlap = len(query_tokens & trigger_tokens)
            score = overlap / len(query_tokens)
            if query.casefold().strip() in trigger.casefold():
                score = max(score, 1.0)
            if score > best_score:
                best_score = score
                matched_trigger = trigger
        if best_score >= min_score:
            results.append({"name": skill["name"], "domain": skill["domain"], "source_path": skill["source_path"], "path": str(SKILL_DIR / skill["source_path"]), "score": round(best_score, 6), "matched_trigger": matched_trigger})
    return sorted(results, key=lambda item: (-item["score"], item["domain"], item["name"]))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="mega-skills-route")
    parser.add_argument("query")
    parser.add_argument("--min-score", type=float, default=0.50)
    parser.add_argument("--index", type=Path)
    args = parser.parse_args(argv)
    index = args.index or Path(__file__).resolve().parents[1] / "references" / "triggers.json"
    print(json.dumps(search_index(index, args.query, args.min_score), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
