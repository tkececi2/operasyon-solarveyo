#!/usr/bin/env python3
"""
Solarveyo Profesyonel App İkonu Oluşturucu
Modern, minimal, profesyonel tasarım
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_professional_icon(output_path, size):
    """Profesyonel Solarveyo ikonu oluştur"""
    
    # Gradient arka plan renkleri (Mavi tonları - güvenilir ve profesyonel)
    color_top = (30, 64, 175)      # Koyu mavi #1E40AF
    color_bottom = (59, 130, 246)  # Açık mavi #3B82F6
    
    # Yeni image oluştur
    img = Image.new('RGB', (size, size), color_bottom)
    draw = ImageDraw.Draw(img)
    
    # Gradient arka plan
    for y in range(size):
        ratio = y / size
        r = int(color_top[0] * (1 - ratio) + color_bottom[0] * ratio)
        g = int(color_top[1] * (1 - ratio) + color_bottom[1] * ratio)
        b = int(color_top[2] * (1 - ratio) + color_bottom[2] * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    # Beyaz çember (logo arkaplanı)
    center = size // 2
    circle_radius = int(size * 0.35)
    
    # Hafif gölge efekti
    shadow_offset = int(size * 0.02)
    draw.ellipse(
        [center - circle_radius + shadow_offset, 
         center - circle_radius + shadow_offset,
         center + circle_radius + shadow_offset, 
         center + circle_radius + shadow_offset],
        fill=(0, 0, 0, 50)
    )
    
    # Ana beyaz çember
    draw.ellipse(
        [center - circle_radius, center - circle_radius,
         center + circle_radius, center + circle_radius],
        fill=(255, 255, 255)
    )
    
    # "S" harfi (Solarveyo)
    try:
        # Sistem fontunu kullan
        font_size = int(size * 0.5)
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()
    
    # "S" harfini çiz
    text = "S"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    text_x = center - text_width // 2
    text_y = center - text_height // 2 - int(size * 0.05)
    
    # Mavi "S" harfi
    draw.text((text_x, text_y), text, fill=(30, 64, 175), font=font)
    
    # Alt kısımda küçük nokta (design element)
    dot_radius = int(size * 0.05)
    dot_y = center + int(size * 0.25)
    draw.ellipse(
        [center - dot_radius, dot_y - dot_radius,
         center + dot_radius, dot_y + dot_radius],
        fill=(251, 191, 36)  # Sarı nokta #FBBF24
    )
    
    # Kaydet
    img.save(output_path, 'PNG', quality=100)
    print(f"✓ {size}x{size} ikon oluşturuldu: {output_path}")

def main():
    # Output klasörü
    output_dir = "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    os.makedirs(output_dir, exist_ok=True)
    
    print("🎨 Profesyonel Solarveyo ikonu oluşturuluyor...")
    
    # iOS gereken boyutlar
    sizes = [
        (20, "20"),    # iPhone Notification iOS 7-14
        (29, "29"),    # iPhone Spotlight iOS 5,6
        (40, "40"),    # iPhone Spotlight iOS 7-14
        (58, "58"),    # iPhone Spotlight @2x iOS 5,6
        (60, "60"),    # iPhone App iOS 7-14
        (76, "76"),    # iPad App iOS 7-14
        (80, "80"),    # iPhone Spotlight @2x iOS 7-14
        (87, "87"),    # iPhone App @3x iOS 7-14
        (120, "120"),  # iPhone App @2x iOS 7-14
        (152, "152"),  # iPad App @2x iOS 7-14
        (167, "167"),  # iPad Pro App @2x iOS 9-14
        (180, "180"),  # iPhone App @3x iOS 7-14
        (1024, "1024") # App Store
    ]
    
    for size, name in sizes:
        output_path = os.path.join(output_dir, f"icon-{name}.png")
        create_professional_icon(output_path, size)
    
    # Contents.json oluştur
    contents_json = """{
  "images" : [
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "icon-40.png",
      "scale" : "2x"
    },
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "icon-60.png",
      "scale" : "3x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "icon-58.png",
      "scale" : "2x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "icon-87.png",
      "scale" : "3x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "icon-80.png",
      "scale" : "2x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "icon-120.png",
      "scale" : "3x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "icon-120.png",
      "scale" : "2x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "icon-180.png",
      "scale" : "3x"
    },
    {
      "size" : "20x20",
      "idiom" : "ipad",
      "filename" : "icon-20.png",
      "scale" : "1x"
    },
    {
      "size" : "20x20",
      "idiom" : "ipad",
      "filename" : "icon-40.png",
      "scale" : "2x"
    },
    {
      "size" : "29x29",
      "idiom" : "ipad",
      "filename" : "icon-29.png",
      "scale" : "1x"
    },
    {
      "size" : "29x29",
      "idiom" : "ipad",
      "filename" : "icon-58.png",
      "scale" : "2x"
    },
    {
      "size" : "40x40",
      "idiom" : "ipad",
      "filename" : "icon-40.png",
      "scale" : "1x"
    },
    {
      "size" : "40x40",
      "idiom" : "ipad",
      "filename" : "icon-80.png",
      "scale" : "2x"
    },
    {
      "size" : "76x76",
      "idiom" : "ipad",
      "filename" : "icon-76.png",
      "scale" : "1x"
    },
    {
      "size" : "76x76",
      "idiom" : "ipad",
      "filename" : "icon-152.png",
      "scale" : "2x"
    },
    {
      "size" : "83.5x83.5",
      "idiom" : "ipad",
      "filename" : "icon-167.png",
      "scale" : "2x"
    },
    {
      "size" : "1024x1024",
      "idiom" : "ios-marketing",
      "filename" : "icon-1024.png",
      "scale" : "1x"
    }
  ],
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
}"""
    
    with open(os.path.join(output_dir, "Contents.json"), "w") as f:
        f.write(contents_json)
    
    print("\n✅ TÜM İKONLAR OLUŞTURULDU!")
    print(f"📁 Konum: {output_dir}")
    print("\n🎨 Tasarım:")
    print("   - Gradient mavi arka plan (profesyonel)")
    print("   - Beyaz çember (temiz)")
    print("   - Mavi 'S' harfi (Solarveyo)")
    print("   - Sarı nokta (enerji vurgusu)")
    print("\n📱 Xcode'da:")
    print("   1. Projeyi temizle (Clean Build Folder)")
    print("   2. Run et")
    print("   3. Yeni ikon görünecek! ✨")

if __name__ == "__main__":
    main()

