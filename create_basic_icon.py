#!/usr/bin/env python3
"""
SolarVeyo iOS App Icon Generator - En basit versiyon
Beyaz arka plan üzerinde mavi S logosu
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
    
    # Mavi renk (Tailwind blue-600)
    blue_color = (37, 99, 235)
    
    # Mavi arka plan dairesi
    padding = size // 10
    draw.ellipse([padding, padding, size - padding, size - padding], fill=blue_color)
    
    # Beyaz S harfi
    try:
        font_size = int(size * 0.5)
        # Basit font kullan
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        
        text = "S"
        # Text boyutunu hesapla
        left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
        text_width = right - left
        text_height = bottom - top
        
        # Ortala
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - text_height // 10
        
        # Beyaz S çiz
        draw.text((x, y), text, fill='white', font=font)
    except Exception as e:
        # Font yüklenemezse basit bir S çiz
        # Dikdörtgenlerle S harfi oluştur
        line_width = size // 10
        
        # Üst yatay çizgi
        draw.rectangle([size//3, size//4, 2*size//3, size//4 + line_width], fill='white')
        
        # Orta yatay çizgi
        draw.rectangle([size//3, size//2 - line_width//2, 2*size//3, size//2 + line_width//2], fill='white')
        
        # Alt yatay çizgi
        draw.rectangle([size//3, 3*size//4 - line_width, 2*size//3, 3*size//4], fill='white')
        
        # Sol üst dikey
        draw.rectangle([size//3, size//4, size//3 + line_width, size//2], fill='white')
        
        # Sağ alt dikey
        draw.rectangle([2*size//3 - line_width, size//2, 2*size//3, 3*size//4], fill='white')
    
    return img

# Output dizinini kontrol et
os.makedirs(output_dir, exist_ok=True)

# Icon'ları oluştur
print("SolarVeyo iOS icon'ları oluşturuluyor...")

for filename, size in sizes.items():
    try:
        icon = create_icon(size)
        filepath = os.path.join(output_dir, filename)
        icon.save(filepath, "PNG", quality=100)
        print(f"✓ {filename} ({size}x{size}px) oluşturuldu")
    except Exception as e:
        print(f"✗ {filename} oluşturulurken hata: {e}")

print("\n✅ Icon oluşturma tamamlandı!")
print(f"📁 Konum: {output_dir}")
