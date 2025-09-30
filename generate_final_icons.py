#!/usr/bin/env python3
"""
SolarVeyo iOS App Icon Generator
Beyaz arka plan üzerinde mavi SolarVeyo logosu ve altında Operasyon yazısı
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

def create_icon(size):
    """Belirtilen boyutta icon oluştur"""
    # Beyaz arka plan
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Mavi renk
    blue_color = (30, 64, 175)  # Tailwind blue-800
    
    # Font boyutları (size'a göre oranla)
    main_font_size = int(size * 0.18)
    sub_font_size = int(size * 0.10)
    
    # Sistem fontunu kullan
    try:
        # macOS sistem fontu
        main_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", main_font_size, index=1)  # Bold
        sub_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", sub_font_size)
    except:
        # Fallback to default
        main_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()
    
    # SolarVeyo yazısı
    main_text = "SolarVeyo"
    main_bbox = draw.textbbox((0, 0), main_text, font=main_font)
    main_width = main_bbox[2] - main_bbox[0]
    main_height = main_bbox[3] - main_bbox[1]
    
    # Operasyon yazısı
    sub_text = "Operasyon"
    sub_bbox = draw.textbbox((0, 0), sub_text, font=sub_font)
    sub_width = sub_bbox[2] - sub_bbox[0]
    sub_height = sub_bbox[3] - sub_bbox[1]
    
    # Toplam yükseklik ve pozisyonlar
    total_height = main_height + sub_height + int(size * 0.02)  # Araya küçük boşluk
    
    # Merkeze yerleştir
    main_x = (size - main_width) // 2
    main_y = (size - total_height) // 2
    
    sub_x = (size - sub_width) // 2
    sub_y = main_y + main_height + int(size * 0.02)
    
    # Metinleri çiz
    draw.text((main_x, main_y), main_text, fill=blue_color, font=main_font)
    draw.text((sub_x, sub_y), sub_text, fill=blue_color, font=sub_font)
    
    # Çok küçük boyutlarda sadece "S" harfi göster
    if size < 60:
        img = Image.new('RGB', (size, size), color='white')
        draw = ImageDraw.Draw(img)
        
        # Büyük S harfi
        s_font_size = int(size * 0.6)
        try:
            s_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", s_font_size, index=1)
        except:
            s_font = ImageFont.load_default()
        
        s_text = "S"
        s_bbox = draw.textbbox((0, 0), s_text, font=s_font)
        s_width = s_bbox[2] - s_bbox[0]
        s_height = s_bbox[3] - s_bbox[1]
        
        s_x = (size - s_width) // 2
        s_y = (size - s_height) // 2
        
        draw.text((s_x, s_y), s_text, fill=blue_color, font=s_font)
    
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