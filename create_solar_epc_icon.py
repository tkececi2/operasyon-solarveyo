#!/usr/bin/env python3
"""
Solarveyo - Solar EPC Profesyonel İkon
Güneş Enerji + Operasyonel Yönetim
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

def create_solar_epc_icon(output_path, size):
    """Solar EPC profesyonel ikonu oluştur"""
    
    # Arka plan renkleri - Enerji teması
    bg_color = (255, 255, 255)  # Beyaz arka plan
    
    # Yeni image oluştur
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    center = size // 2
    
    # Ana çember - Mavi (Güvenilir)
    main_circle_radius = int(size * 0.42)
    draw.ellipse(
        [center - main_circle_radius, center - main_circle_radius,
         center + main_circle_radius, center + main_circle_radius],
        fill=(30, 64, 175)  # Koyu mavi #1E40AF
    )
    
    # Solar Panel Grid Efekti (4x4 grid)
    grid_size = int(size * 0.35)
    grid_start_x = center - grid_size // 2
    grid_start_y = center - grid_size // 2
    cell_size = grid_size // 4
    gap = int(size * 0.01)
    
    # 4x4 Solar panel cells
    for row in range(4):
        for col in range(4):
            x = grid_start_x + col * cell_size + gap
            y = grid_start_y + row * cell_size + gap
            cell_w = cell_size - gap * 2
            cell_h = cell_size - gap * 2
            
            # Gradient effect (açık-koyu mavi tonları)
            # Üst hücreler daha açık (güneş ışığı etkisi)
            brightness = 1.0 + (3 - row) * 0.15
            r = min(255, int(59 * brightness))
            g = min(255, int(130 * brightness))
            b = min(255, int(246 * brightness))
            
            draw.rectangle(
                [x, y, x + cell_w, y + cell_h],
                fill=(r, g, b)
            )
    
    # Elektrik şimşek işareti (ortada, küçük)
    lightning_color = (251, 191, 36)  # Sarı #FBBF24
    bolt_size = int(size * 0.18)
    bolt_x = center
    bolt_y = center
    
    # Şimşek çizgisi (basit zigzag)
    bolt_width = int(size * 0.04)
    lightning_points = [
        (bolt_x, bolt_y - bolt_size // 2),  # üst
        (bolt_x + bolt_width, bolt_y - bolt_width),
        (bolt_x, bolt_y + bolt_width // 2),
        (bolt_x + bolt_width, bolt_y + bolt_size // 2),  # alt
        (bolt_x - bolt_width // 4, bolt_y + bolt_width),
        (bolt_x, bolt_y - bolt_width // 2),
        (bolt_x - bolt_width, bolt_y - bolt_size // 2),
    ]
    draw.polygon(lightning_points, fill=lightning_color)
    
    # Dış halka - Sarı/Turuncu (Enerji vurgusu)
    outer_ring_radius = int(size * 0.46)
    inner_ring_radius = int(size * 0.42)
    draw.ellipse(
        [center - outer_ring_radius, center - outer_ring_radius,
         center + outer_ring_radius, center + outer_ring_radius],
        outline=(251, 191, 36),  # Sarı
        width=int(size * 0.02)
    )
    
    # Kaydet
    img.save(output_path, 'PNG', quality=100)
    print(f"✓ {size}x{size} Solar EPC ikonu oluşturuldu: {output_path}")

def main():
    # Output klasörü
    output_dir = "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    os.makedirs(output_dir, exist_ok=True)
    
    print("⚡ Solarveyo - Solar EPC Profesyonel İkon Oluşturuluyor...")
    print("🔧 Güneş Enerji + Operasyonel Yönetim Teması")
    
    # iOS gereken boyutlar
    sizes = [
        (20, "20"),
        (29, "29"),
        (40, "40"),
        (58, "58"),
        (60, "60"),
        (76, "76"),
        (80, "80"),
        (87, "87"),
        (120, "120"),
        (152, "152"),
        (167, "167"),
        (180, "180"),
        (1024, "1024")
    ]
    
    for size, name in sizes:
        output_path = os.path.join(output_dir, f"icon-{name}.png")
        create_solar_epc_icon(output_path, size)
    
    # Contents.json
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
    
    print("\n✅ SOLAR EPC İKONLARI OLUŞTURULDU!")
    print(f"📁 Konum: {output_dir}")
    print("\n🎨 Tasarım Özellikleri:")
    print("   ⚡ Solar Panel Grid (4x4 hücreler)")
    print("   🔋 Elektrik şimşek işareti (enerji)")
    print("   🔵 Mavi çember (güvenilir, profesyonel)")
    print("   🟡 Sarı halka (güneş enerjisi)")
    print("   ☀️ Gradient efekt (güneş ışığı)")
    print("\n💼 Solarveyo - Solar EPC Operasyonel Yönetim")
    print("\n📱 Xcode'da:")
    print("   1. Product → Clean Build Folder (⇧⌘K)")
    print("   2. Run (⌘R)")
    print("   3. YENİ ikon + BEYAZ status bar! ✨")

if __name__ == "__main__":
    main()

