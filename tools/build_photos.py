#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rebuild FRAME's local real-photo assets from a photo library.

Usage (from the project root):
    python tools/build_photos.py
    python tools/build_photos.py --src ../照片库 --out assets/photos --js js/photodata.js

Input:  <src>/manifest.csv with columns:
        category,brand,model,date,file,source,source_url,license,author,width,height
Output: <out>/*.jpg  (max 1400px long edge, quality 84, never upscaled)
        <js>         (window.FRAME_PHOTO_LIB manifest, loaded by index.html)

The source photos are never modified. Only a resized web copy is written.
Requires: Python 3.8+ and Pillow.
"""
import argparse
import csv
import json
import os
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is required: pip install pillow")

BRAND_ID = {
    "Canon": "canon", "Sony": "sony", "Nikon": "nikon", "Fujifilm": "fujifilm",
    "Panasonic": "panasonic", "Sigma": "sigma", "Leica": "leica", "OM System": "om",
    "DJI": "dji", "GoPro": "gopro", "RED": "red", "Blackmagic": "blackmagic",
    "ARRI": "arri", "Ricoh": "ricoh", "Hasselblad": "hasselblad", "Kodak": "kodak",
    "Insta360": "insta360", "Z CAM": "zcam", "Pentax": "pentax", "Pixii": "pixii",
}
BRAND_CN = {
    "canon": "佳能", "sony": "索尼", "nikon": "尼康", "fujifilm": "富士胶片",
    "panasonic": "松下", "sigma": "适马", "leica": "徕卡", "om": "OM SYSTEM",
    "dji": "大疆创新", "gopro": "GoPro", "red": "RED 数字电影",
    "blackmagic": "Blackmagic Design", "arri": "ARRI", "ricoh": "理光",
    "hasselblad": "哈苏", "kodak": "柯达", "insta360": "Insta360",
    "zcam": "Z CAM", "pentax": "宾得", "pixii": "Pixii",
}
CAT_LABEL = {
    "mirrorless": "微单 / 单反", "compact": "卡片 / 口袋", "action": "运动 / 全景",
    "cinema": "电影机", "other": "长焦 / 三防 / 拍立得",
}


def slug(text):
    text = str(text).lower().replace("+", " plus ").replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "photo"


def edge_color(im):
    im = im.convert("RGB")
    w, h = im.size
    px = im.load()
    pts = []
    step = max(1, min(w, h) // 40)
    for x in range(0, w, step):
        pts.append(px[x, 1])
        pts.append(px[x, h - 2])
    for y in range(0, h, step):
        pts.append(px[1, y])
        pts.append(px[w - 2, y])
    r = sorted(p[0] for p in pts)[len(pts) // 2]
    g = sorted(p[1] for p in pts)[len(pts) // 2]
    b = sorted(p[2] for p in pts)[len(pts) // 2]
    return "#%02x%02x%02x" % (r, g, b)


def is_clean(im):
    small = im.convert("RGB").resize((36, 36))
    px = list(small.getdata())
    corners = [px[0], px[35], px[36 * 35], px[-1]]
    mean = sum(sum(p) / 3 for p in corners) / 4
    spread = max(max(p) - min(p) for p in corners)
    return mean > 205 and spread < 46


def main():
    root = Path(__file__).resolve().parent.parent
    ap = argparse.ArgumentParser(description="Build FRAME photo assets from a local photo library.")
    ap.add_argument("--src", default=str(root.parent / "照片库"), help="photo library folder with manifest.csv")
    ap.add_argument("--out", default=str(root / "assets" / "photos"), help="web photo output folder")
    ap.add_argument("--js", default=str(root / "js" / "photodata.js"), help="generated JS manifest")
    ap.add_argument("--max", type=int, default=1400, help="max long edge in px")
    ap.add_argument("--quality", type=int, default=84, help="JPEG quality")
    args = ap.parse_args()

    src = Path(args.src)
    out = Path(args.out)
    js = Path(args.js)
    manifest = src / "manifest.csv"
    if not manifest.exists():
        sys.exit(f"manifest.csv not found: {manifest}")
    out.mkdir(parents=True, exist_ok=True)
    js.parent.mkdir(parents=True, exist_ok=True)

    rows = list(csv.DictReader(open(manifest, encoding="utf-8-sig")))
    items = []
    used = set()
    missing = []
    for row in rows:
        rel = (row.get("file") or "").replace("/", os.sep)
        photo = src / rel
        if not photo.exists():
            missing.append(rel)
            continue
        brand = (row.get("brand") or "").strip()
        brand_id = BRAND_ID.get(brand) or slug(brand)
        model = (row.get("model") or "").strip()
        category = (row.get("category") or "other").strip()
        base = f"{brand_id}-{slug(model)}"
        name = base + ".jpg"
        n = 2
        while name in used:
            name = f"{base}-{n}.jpg"
            n += 1
        used.add(name)
        try:
            im = Image.open(photo)
            im = ImageOps.exif_transpose(im)
            if im.mode in ("RGBA", "LA", "P"):
                im = im.convert("RGBA")
                canvas = Image.new("RGB", im.size, (255, 255, 255))
                canvas.paste(im, mask=im.split()[-1])
                im = canvas
            else:
                im = im.convert("RGB")
            w, h = im.size
            long_edge = max(w, h)
            if long_edge > args.max:
                scale = args.max / float(long_edge)
                im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
            clean = is_clean(im)
            portrait = h > w * 1.08
            fit = "contain" if (clean or portrait) else "cover"
            im.save(out / name, "JPEG", quality=args.quality, optimize=True, progressive=True)
            items.append({
                "id": base,
                "brand": brand,
                "brandId": brand_id,
                "brandCn": BRAND_CN.get(brand_id, brand),
                "model": model,
                "category": category,
                "catLabel": CAT_LABEL.get(category, category),
                "date": row.get("date") or "",
                "file": name,
                "source": row.get("source") or "",
                "sourceUrl": row.get("source_url") or "",
                "license": row.get("license") or "",
                "author": row.get("author") or "",
                "original": row.get("file") or "",
                "w": w,
                "h": h,
                "clean": bool(clean),
                "portrait": bool(portrait),
                "fit": fit,
                "bg": edge_color(im),
                "tags": [],
            })
        except Exception as exc:  # noqa: BLE001 - report and continue
            missing.append(f"{rel} -> {exc}")

    items.sort(key=lambda x: (x["brandId"], x["date"]))
    payload = {
        "version": "1.0.0",
        "base": "assets/photos/",
        "count": len(items),
        "items": items,
        "brands": BRAND_ID,
        "brandNames": BRAND_CN,
        "categories": CAT_LABEL,
    }
    header = (
        "/* =========================================================\n"
        "   FRAME — local real-photo library\n"
        "   Generated by tools/build_photos.py from the user's local\n"
        "   photo library (manifest.csv). Photos are displayed as-is;\n"
        "   nothing here is AI-generated. Personal, non-commercial use.\n"
        "   ========================================================= */\n"
        "(function () {\n  'use strict';\n"
    )
    with open(js, "w", encoding="utf-8") as f:
        f.write(header)
        f.write("  const DATA = " + json.dumps(payload, ensure_ascii=False, indent=1) + ";\n")
        f.write("  window.FRAME_PHOTO_LIB = DATA;\n})();\n")

    total = sum((out / i["file"]).stat().st_size for i in items)
    print(f"photos: {len(items)}  missing/skipped: {len(missing)}")
    print(f"clean: {sum(1 for i in items if i['clean'])}  scene: {sum(1 for i in items if not i['clean'])}")
    print(f"output: {out}  total: {total / 1024 / 1024:.1f} MB")
    print(f"manifest: {js}")
    if missing:
        print("skipped:")
        for m in missing[:20]:
            print("  " + m)


if __name__ == "__main__":
    main()
