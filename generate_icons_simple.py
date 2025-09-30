#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw
import math

# Icon sizes for iOS
sizes = [
    (40, "Icon-20@2x.png"),
    (60, "Icon-20@3x.png"),
    (58, "Icon-29@2x.png"),
    (87, "Icon-29@3x.png"),
    (80, "Icon-40@2x.png"),
    (120, "Icon-40@3x.png"),
    (120, "Icon-60@2x.png"),
    (180, "Icon-60@3x.png"),
    (1024, "Icon-1024.png"),
]

output_dir = "ios/App/App/Assets.xcassets/AppIcon.appiconset"
os.makedirs(output_dir, exist_ok=True)

def create_icon(size, filename):
    # Create a new image with gradient background
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background (blue)
    for y in range(size):
        # Gradient from #1E40AF to #2563EB
        ratio = y / size
        r = int(30 + (37 - 30) * ratio)
        g = int(64 + (99 - 64) * ratio)
        b = int(175 + (235 - 175) * ratio)
        draw.rectangle([(0, y), (size, y+1)], fill=(r, g, b))
    
    # Draw sun circle (yellow)
    sun_radius = size * 0.12
    sun_center_x = size * 0.5
    sun_center_y = size * 0.28
    
    # Draw sun
    draw.ellipse(
        [(sun_center_x - sun_radius, sun_center_y - sun_radius),
         (sun_center_x + sun_radius, sun_center_y + sun_radius)],
        fill='#FBBF24'
    )
    
    # Draw sun rays
    ray_count = 8
    ray_length = size * 0.08
    ray_offset = sun_radius + size * 0.03
    
    for i in range(ray_count):
        angle = (math.pi * 2 * i) / ray_count
        start_x = sun_center_x + math.cos(angle) * ray_offset
        start_y = sun_center_y + math.sin(angle) * ray_offset
        end_x = sun_center_x + math.cos(angle) * (ray_offset + ray_length)
        end_y = sun_center_y + math.sin(angle) * (ray_offset + ray_length)
        
        draw.line(
            [(start_x, start_y), (end_x, end_y)],
            fill='#FBBF24',
            width=max(1, int(size * 0.02))
        )
    
    # Draw simple "S" letter for SolarVeyo
    text_size = int(size * 0.25)
    text_x = size * 0.5 - text_size * 0.3
    text_y = size * 0.5
    
    # Draw a stylized "S"
    draw.text((text_x, text_y), "S", fill='white', font=None)
    
    # Save the image
    img.save(os.path.join(output_dir, filename), "PNG")
    print(f"Created {filename} ({size}x{size})")

# Generate all icons
for size, filename in sizes:
    create_icon(size, filename)

print("\nAll iOS icons generated successfully!")
print(f"Icons saved to: {output_dir}")
