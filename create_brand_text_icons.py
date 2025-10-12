#!/usr/bin/env python3
"""
SolarVeyo Marka Metin İkonları Oluşturucu

Tasarım:
- Satır 1: "Solar" (siyah)
- Satır 2: "Veyo" (mavi)
- Satır 3: "Operasyon" (gri, küçük)

Küçük boyutlar (< 58px) için okunabilirlik adına "SV" monogramı kullanılır.
Çıktılar, Xcode AppIcon Contents.json ile uyumlu dosya adlarıyla üretilir.
"""

from PIL import Image, ImageDraw, ImageFont
import os


OUTPUT_DIR = "ios/App/App/Assets.xcassets/AppIcon.appiconset"

# Contents.json'daki isimlerle uyumlu dosyalar
SIZES = {
    "icon-20.png": 20,
    "icon-29.png": 29,
    "icon-40.png": 40,
    "icon-58.png": 58,
    "icon-60.png": 60,
    "icon-76.png": 76,
    "icon-80.png": 80,
    "icon-87.png": 87,
    "icon-120.png": 120,
    "icon-152.png": 152,
    "icon-167.png": 167,
    "icon-180.png": 180,
    "icon-1024.png": 1024,
}


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Sistem fontunu yükle, olmadıysa default döndür. Minimum 8px uygula."""
    size = max(8, int(size))
    try:
        if bold:
            return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size, index=1)
        return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
    except Exception:
        return ImageFont.load_default()


def create_icon(size: int) -> Image.Image:
    # Tuval
    img = Image.new("RGB", (size, size), color="white")
    draw = ImageDraw.Draw(img)

    # Renkler
    COLOR_BLACK = (17, 24, 39)   # gray-900
    COLOR_BLUE = (30, 64, 175)   # blue-800
    COLOR_SUB = (55, 65, 81)     # gray-700

    # Küçük boyutlarda monogram kullan
    if size < 58:
        font = load_font(int(size * 0.6), bold=True)
        text = "SV"
        bbox = draw.textbbox((0, 0), text, font=font)
        x = (size - (bbox[2] - bbox[0])) // 2
        y = (size - (bbox[3] - bbox[1])) // 2
        draw.text((x, y), text, fill=COLOR_BLUE, font=font)
        return img

    # Dinamik font boyutları
    solar_font = load_font(size * 0.28, bold=True)
    veyo_font = load_font(size * 0.28, bold=True)
    operasyon_font = load_font(size * 0.12)

    # Metinler
    solar_text = "Solar"
    veyo_text = "Veyo"
    op_text = "Operasyon"

    # Ölçüler
    solar_bbox = draw.textbbox((0, 0), solar_text, font=solar_font)
    veyo_bbox = draw.textbbox((0, 0), veyo_text, font=veyo_font)
    op_bbox = draw.textbbox((0, 0), op_text, font=operasyon_font)

    solar_w = solar_bbox[2] - solar_bbox[0]
    solar_h = solar_bbox[3] - solar_bbox[1]
    veyo_w = veyo_bbox[2] - veyo_bbox[0]
    veyo_h = veyo_bbox[3] - veyo_bbox[1]
    op_w = op_bbox[2] - op_bbox[0]
    op_h = op_bbox[3] - op_bbox[1]

    gap = max(2, int(size * 0.03))
    total_h = solar_h + gap + veyo_h + gap + op_h
    start_y = (size - total_h) // 2

    # Solar (siyah)
    x = (size - solar_w) // 2
    draw.text((x, start_y), solar_text, fill=COLOR_BLACK, font=solar_font)

    # Veyo (mavi)
    y = start_y + solar_h + gap
    x = (size - veyo_w) // 2
    draw.text((x, y), veyo_text, fill=COLOR_BLUE, font=veyo_font)

    # Operasyon (gri)
    y = y + veyo_h + gap
    x = (size - op_w) // 2
    draw.text((x, y), op_text, fill=COLOR_SUB, font=operasyon_font)

    return img


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("SolarVeyo marka metin ikonları oluşturuluyor…")
    for filename, px in SIZES.items():
        icon = create_icon(px)
        path = os.path.join(OUTPUT_DIR, filename)
        icon.save(path, "PNG", quality=100)
        print(f"✓ {filename} ({px}x{px})")
    print(f"\n✅ İkonlar yazıldı: {OUTPUT_DIR}")
    print("Xcode: Product → Clean Build Folder (⇧⌘K) → Run (⌘R)")


if __name__ == "__main__":
    main()


