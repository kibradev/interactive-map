"""
Fetch blip preview images from docs.fivem.net (/blips/radar_*.png|.gif)
and save as '<sprite_id>.png' in the output folder (matches this repo's blips/).

Requires Pillow if any sprite is GIF: pip install pillow

From repo root:
  python scripts/download_fivem_blip_images.py --out-dir blips
  scripts\\download_fivem_blip_images.bat --out-dir blips
"""

from __future__ import annotations

import argparse
import io
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

DOCS_DEFAULT = "https://docs.fivem.net/docs/game-references/blips/"
BASE_HOST = "https://docs.fivem.net"
BLIP_BLOCK = re.compile(
    r'<div class="blip">.*?<img\s+src="(/blips/[^"]+)"[^>]*>.*?<strong>(\d+)</strong>',
    re.IGNORECASE | re.DOTALL,
)
VALID_BLIP_PATH = re.compile(r"^/blips/radar_[a-z0-9_]+\.(?:png|gif)$", re.I)
UA = "Mozilla/5.0 (compatible; interactive-map-blip-fetch/1.0; +https://github.com/)"

try:
    from PIL import Image
except ImportError:
    Image = None


def http_get(url: str, timeout: float = 45.0) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def parse_blip_entries(html: str) -> list[tuple[int, str]]:
    seen: set[int] = set()
    out: list[tuple[int, str]] = []
    for m in BLIP_BLOCK.finditer(html):
        rel = m.group(1)
        if not VALID_BLIP_PATH.match(rel):
            continue
        sid = int(m.group(2))
        if sid in seen:
            continue
        seen.add(sid)
        out.append((sid, rel))
    out.sort(key=lambda x: x[0])
    return out


def image_bytes_to_png(raw: bytes, rel_path: str) -> bytes:
    lower = rel_path.lower()
    if lower.endswith(".png"):
        return raw
    if lower.endswith(".gif"):
        if Image is None:
            raise RuntimeError(
                "GIF blip sprites need Pillow. Run: pip install pillow"
            )
        im = Image.open(io.BytesIO(raw))
        if im.mode not in ("RGBA", "RGB"):
            im = im.convert("RGBA")
        buf = io.BytesIO()
        im.save(buf, format="PNG", optimize=True)
        return buf.getvalue()
    raise ValueError(f"Unsupported image type: {rel_path}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--out-dir",
        type=Path,
        default=Path("blips"),
        help="Output directory (default: blips next to cwd).",
    )
    ap.add_argument(
        "--docs-url",
        default=DOCS_DEFAULT,
        help="FiveM blips documentation page to scrape.",
    )
    ap.add_argument("--workers", type=int, default=8, help="Parallel download workers.")
    ap.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip if <sprite_id>.png already exists.",
    )
    ap.add_argument("--dry-run", action="store_true", help="List sprites only, no I/O.")
    ap.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Process only the first N sprites after sort (0 = all).",
    )
    args = ap.parse_args()

    print(f"Fetching index {args.docs_url!r} ...")
    try:
        html = http_get(args.docs_url).decode("utf-8", errors="replace")
    except urllib.error.URLError as e:
        print(f"Failed to load docs: {e}", file=sys.stderr)
        return 1

    html = re.sub(r"<!--.*?-->", "", html, flags=re.DOTALL)
    entries = parse_blip_entries(html)
    if not entries:
        print("No blip entries found (HTML layout may have changed).", file=sys.stderr)
        return 1

    if args.limit > 0:
        entries = entries[: args.limit]

    gifs = sum(1 for _, rel in entries if rel.lower().endswith(".gif"))
    if gifs and Image is None:
        print(
            f"This page references {gifs} GIF sprites; install Pillow: pip install pillow",
            file=sys.stderr,
        )
        return 1

    print(f"Found {len(entries)} blip sprites (GIF sources: {gifs}).")

    if args.dry_run:
        for sid, rel in entries[:20]:
            print(f"  {sid:4d}  {rel}")
        if len(entries) > 20:
            print(f"  ... and {len(entries) - 20} more")
        return 0

    args.out_dir.mkdir(parents=True, exist_ok=True)

    url_cache: dict[str, bytes] = {}

    def load_url(rel: str) -> bytes:
        if rel in url_cache:
            return url_cache[rel]
        url = BASE_HOST + rel
        data = http_get(url)
        url_cache[rel] = data
        return data

    def job(sid: int, rel: str) -> tuple[int, str, bool]:
        dest = args.out_dir / f"{sid}.png"
        if args.skip_existing and dest.is_file():
            return sid, rel, True
        raw = load_url(rel)
        png = image_bytes_to_png(raw, rel)
        dest.write_bytes(png)
        return sid, rel, False

    done = 0
    wrote = 0
    err = 0
    t0 = time.perf_counter()
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        futures = {ex.submit(job, sid, rel): (sid, rel) for sid, rel in entries}
        for fut in as_completed(futures):
            sid, rel = futures[fut]
            try:
                _, _, skipped = fut.result()
                done += 1
                if not skipped:
                    wrote += 1
                if wrote and wrote % 50 == 0:
                    print(f"  ... wrote {wrote} files")
            except Exception as e:
                err += 1
                print(f"ERROR {sid} {rel}: {e}", file=sys.stderr)

    dt = time.perf_counter() - t0
    print(
        f"Done: {done} ok, {wrote} written, {err} errors, {dt:.1f}s -> {args.out_dir.resolve()}"
    )
    return 0 if err == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
