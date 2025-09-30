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
    # Create a new image with white background
    img = Image.new('RGB', (size, size), color='#FFFFFF')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple sun icon at the top
    sun_radius = size * 0.08
    sun_center_x = size * 0.5
    sun_center_y = size * 0.25
    
    # Draw sun circle in yellow/orange
    draw.ellipse(
        [(sun_center_x - sun_radius, sun_center_y - sun_radius),
         (sun_center_x + sun_radius, sun_center_y + sun_radius)],
        fill='#F59E0B'
    )
    
    # Draw sun rays
    ray_count = 8
    ray_length = size * 0.05
    ray_offset = sun_radius + size * 0.02
    
    for i in range(ray_count):
        angle = (math.pi * 2 * i) / ray_count
        start_x = sun_center_x + math.cos(angle) * ray_offset
        start_y = sun_center_y + math.sin(angle) * ray_offset
        end_x = sun_center_x + math.cos(angle) * (ray_offset + ray_length)
        end_y = sun_center_y + math.sin(angle) * (ray_offset + ray_length)
        
        draw.line(
            [(start_x, start_y), (end_x, end_y)],
            fill='#F59E0B',
            width=max(1, int(size * 0.015))
        )
    
    # Draw "Solar" text in black
    solar_y = size * 0.45
    # Simple text without font (will be basic but works)
    text_size = int(size * 0.08)
    
    # Draw rectangles to simulate text "Solar"
    text_x = size * 0.25
    draw.rectangle([(text_x, solar_y), (text_x + size * 0.12, solar_y + text_size)], fill='#1F2937')
    
    # Draw "Veyo" in blue
    veyo_x = text_x + size * 0.15
    draw.rectangle([(veyo_x, solar_y), (veyo_x + size * 0.12, solar_y + text_size)], fill='#2563EB')
    
    # Draw "OPERASYON" as a gray bar
    op_y = size * 0.58
    op_height = int(size * 0.04)
    op_x = size * 0.3
    draw.rectangle([(op_x, op_y), (op_x + size * 0.4, op_y + op_height)], fill='#6B7280')
    
    # Save the image
    img.save(os.path.join(output_dir, filename), "PNG")
    print(f"Created {filename} ({size}x{size})")

# Generate all icons
for size, filename in sizes:
    create_icon(size, filename)

# Also update the default Capacitor icon
import shutil
shutil.copy(
    os.path.join(output_dir, "Icon-1024.png"),
    os.path.join(output_dir, "AppIcon-512@2x.png")
)

print("\nAll iOS icons generated successfully!")
print(f"Icons saved to: {output_dir}")
