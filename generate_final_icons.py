#!/usr/bin/env python3
"""
SolarVeyo iOS App Icon Generator (Marka Metin İkonu)

İstenen tasarım:
- Üst satır: "Solar" (siyah)
- Alt satır: "Veyo" (mavi)
- En altta: "Operasyon" (küçük)

Küçük boyutlarda okunabilirliği korumak için 60px altı boyutlarda
"SV" monogramı kullanılır.
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Icon boyutları
sizes = {
    "Icon-20@2x.png": 40,
    "Icon-20@3x.png": 60,
    "Icon-29@2x.png": 58,
    "Icon-29@3x.png": 87,
    "Icon-40@2x.png": 80,
    "Icon-40@3x.png": 120,
    "Icon-60@2x.png": 120,
    "Icon-60@3x.png": 180,
    "Icon-1024.png": 1024,
    "AppIcon-512@2x.png": 1024
}

output_dir = "ios/App/App/Assets.xcassets/AppIcon.appiconset"

def _load_font(size: int, bold: bool = False):
    """Sistem fontunu yüklemeye çalış, olmazsa default kullan."""
    try:
        if bold:
            return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size, index=1)
        return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
    except Exception:
        return ImageFont.load_default()

def create_icon(size: int):
    """Belirtilen boyutta marka metin ikonu oluşturur."""
    # Beyaz arka plan
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)

    # Renkler
    blue_color = (30, 64, 175)     # Tailwind blue-800 (#1E40AF)
    black_color = (17, 24, 39)     # Tailwind gray-900 (#111827)
    sub_color = (55, 65, 81)       # Tailwind gray-700 (#374151)

    # Küçük boyutlar için monogram (okunabilirlik)
    if size < 60:
        monogram_font = _load_font(int(size * 0.6), bold=True)
        text = "SV"
        bbox = draw.textbbox((0, 0), text, font=monogram_font)
        x = (size - (bbox[2] - bbox[0])) // 2
        y = (size - (bbox[3] - bbox[1])) // 2
        draw.text((x, y), text, fill=blue_color, font=monogram_font)
        return img

    # Boyuta göre fontlar
    solar_font = _load_font(int(size * 0.26), bold=True)
    veyo_font = _load_font(int(size * 0.26), bold=True)
    operasyon_font = _load_font(int(size * 0.11), bold=False)

    # Metin ölçümleri
    solar_text = "Solar"
    veyo_text = "Veyo"
    operasyon_text = "Operasyon"

    solar_bbox = draw.textbbox((0, 0), solar_text, font=solar_font)
    veyo_bbox = draw.textbbox((0, 0), veyo_text, font=veyo_font)
    operasyon_bbox = draw.textbbox((0, 0), operasyon_text, font=operasyon_font)

    solar_w = solar_bbox[2] - solar_bbox[0]
    solar_h = solar_bbox[3] - solar_bbox[1]
    veyo_w = veyo_bbox[2] - veyo_bbox[0]
    veyo_h = veyo_bbox[3] - veyo_bbox[1]
    operasyon_w = operasyon_bbox[2] - operasyon_bbox[0]
    operasyon_h = operasyon_bbox[3] - operasyon_bbox[1]

    gap = int(size * 0.03)
    total_h = solar_h + gap + veyo_h + gap + operasyon_h

    # Başlangıç Y (dikey merkezleme)
    start_y = (size - total_h) // 2

    # Solar (üst satır) - ortala
    solar_x = (size - solar_w) // 2
    draw.text((solar_x, start_y), solar_text, fill=black_color, font=solar_font)

    # Veyo (ikinci satır) - ortala
    veyo_x = (size - veyo_w) // 2
    veyo_y = start_y + solar_h + gap
    draw.text((veyo_x, veyo_y), veyo_text, fill=blue_color, font=veyo_font)

    # Operasyon (alt satır, küçük) - ortala
    operasyon_x = (size - operasyon_w) // 2
    operasyon_y = veyo_y + veyo_h + gap
    draw.text((operasyon_x, operasyon_y), operasyon_text, fill=sub_color, font=operasyon_font)

    return img

# Icon'ları oluştur
print("SolarVeyo iOS icon'ları oluşturuluyor...")

for filename, size in sizes.items():
    icon = create_icon(size)
    filepath = os.path.join(output_dir, filename)
    icon.save(filepath, "PNG", quality=100)
    print(f"✓ {filename} ({size}x{size}px) oluşturuldu")

print("\n✅ Tüm icon'lar başarıyla oluşturuldu!")
print(f"📁 Konum: {output_dir}")