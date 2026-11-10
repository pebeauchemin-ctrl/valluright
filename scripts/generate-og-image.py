#!/usr/bin/env python3
# Regenerates public/og/valuright-og.png (1200x630 social card) from public/logo.png.
# Colors are the logo's own navy/green/gold; fonts are Poppins (the site's display face).
# Usage: python3 scripts/generate-og-image.py [path/to/Poppins-dir]
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = Path(sys.argv[1] if len(sys.argv) > 1 else "/usr/share/fonts/truetype/sand-box/google/Poppins")
W, H = 1200, 630
NAVY, GREEN, GOLD, WHITE = "#0d223d", "#166a4f", "#f2b134", "#ffffff"

img = Image.new("RGB", (W, H), WHITE)
draw = ImageDraw.Draw(img)
draw.rectangle([0, H - 24, W, H], fill=NAVY)
draw.rectangle([0, H - 24, 360, H], fill=GREEN)
draw.rectangle([360, H - 24, 480, H], fill=GOLD)

logo = Image.open(ROOT / "public/logo.png").convert("RGB").resize((380, 380), Image.LANCZOS)
img.paste(logo, (70, 110))

semibold = ImageFont.truetype(str(FONT_DIR / "Poppins-SemiBold.ttf"), 92)
medium = ImageFont.truetype(str(FONT_DIR / "Poppins-Medium.ttf"), 50)

x = 480
draw.text((x, 170), "valuright", font=semibold, fill=NAVY)
draw.text((x + draw.textlength("valuright", font=semibold), 170), ".ai", font=semibold, fill=GREEN)
draw.text((x, 320), "Know your value.", font=medium, fill=NAVY)
draw.text((x, 390), "Plan your exit.", font=medium, fill=GREEN)

out = ROOT / "public/og/valuright-og.png"
img.save(out, optimize=True)
print(out, img.size)
