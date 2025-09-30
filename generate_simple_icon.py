#!/usr/bin/env python3
"""
SolarVeyo iOS App Icon Generator - Basit versiyon
"""

from PIL import Image, ImageDraw
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
    """Belirtilen boyutta icon oluştur - Basit gradient ve S logosu"""
    # Beyaz arka plan
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Mavi renk
    blue_color = (30, 64, 175)  # Tailwind blue-800
    light_blue = (59, 130, 246)  # Tailwind blue-500
    
    # Ortada mavi bir daire çiz
    padding = size // 8
    circle_bbox = [padding, padding, size - padding, size - padding]
    
    # Gradient efekti için birkaç daire çiz
    for i in range(10):
        offset = i * 2
        color_ratio = i / 10
        r = int(blue_color[0] * (1 - color_ratio) + light_blue[0] * color_ratio)
        g = int(blue_color[1] * (1 - color_ratio) + light_blue[1] * color_ratio)
        b = int(blue_color[2] * (1 - color_ratio) + light_blue[2] * color_ratio)
        
        draw.ellipse([
            circle_bbox[0] + offset,
            circle_bbox[1] + offset,
            circle_bbox[2] - offset,
            circle_bbox[3] - offset
        ], fill=(r, g, b))
    
    # Ortaya beyaz "S" harfi çiz (basit çizgilerle)
    center_x = size // 2
    center_y = size // 2
    s_size = size // 3
    
    # S harfinin basit çizimi
    points = []
    
    # S harfinin üst kıvrımı
    for i in range(20):
        angle = i * 9  # 0-180 derece
        x = center_x + (s_size // 3) * (1 - i/20)
        y = center_y - s_size // 2 + (s_size // 4) * (i/20)
        points.append((x, y))
    
    # S harfinin alt kıvrımı
    for i in range(20):
        angle = i * 9  # 0-180 derece
        x = center_x - (s_size // 3) * (i/20)
        y = center_y + (s_size // 4) * (i/20)
        points.append((x, y))
    
    # Beyaz S harfi çiz (kalın çizgi)
    if len(points) > 1:
        for i in range(len(points) - 1):
            draw.line([points[i], points[i+1]], fill='white', width=max(3, size//20))
    
    # Alternatif: Basit metin bazlı S
    # Büyük boyutlarda metin kullan
    if size >= 120:
        # Basit S harfi yaz
        from PIL import ImageFont
        try:
            font_size = int(size * 0.4)
            # Sistem fontunu kullanmaya çalış
            font = ImageFont.truetype("/System/Library/Fonts/Avenir.ttc", font_size)
            
            # S harfini ortala
            text = "S"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (size - text_width) // 2
            y = (size - text_height) // 2 - text_height // 8  # Biraz yukarı kaydır
            
            # Beyaz S harfi çiz
            draw.text((x, y), text, fill='white', font=font)
        except:
            pass  # Font yüklenemezse çizgiyi kullan
    
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
