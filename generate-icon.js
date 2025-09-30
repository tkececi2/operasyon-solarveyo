const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [
    { size: 20, scale: 2 },
    { size: 20, scale: 3 },
    { size: 29, scale: 2 },
    { size: 29, scale: 3 },
    { size: 40, scale: 2 },
    { size: 40, scale: 3 },
    { size: 60, scale: 2 },
    { size: 60, scale: 3 },
    { size: 1024, scale: 1 }
];

function drawIcon(ctx, actualSize) {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, actualSize, actualSize);
    gradient.addColorStop(0, '#1e40af');
    gradient.addColorStop(1, '#2563eb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, actualSize, actualSize);
    
    // Güneş simgesi
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = actualSize * 0.02;
    
    // Güneş merkezi
    const sunRadius = actualSize * 0.12;
    const sunX = actualSize * 0.5;
    const sunY = actualSize * 0.28;
    
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Güneş ışınları
    const rayCount = 8;
    const rayLength = actualSize * 0.08;
    const rayOffset = sunRadius + actualSize * 0.03;
    
    for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 2 * i) / rayCount;
        const startX = sunX + Math.cos(angle) * rayOffset;
        const startY = sunY + Math.sin(angle) * rayOffset;
        const endX = sunX + Math.cos(angle) * (rayOffset + rayLength);
        const endY = sunY + Math.sin(angle) * (rayOffset + rayLength);
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    
    // SolarVeyo text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${actualSize * 0.14}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Ana başlık
    ctx.fillText('SolarVeyo', actualSize * 0.5, actualSize * 0.58);
    
    // Alt başlık
    ctx.font = `${actualSize * 0.08}px Arial`;
    ctx.fillText('Operasyon', actualSize * 0.5, actualSize * 0.72);
}

// Output directory
const outputDir = path.join(__dirname, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

// Contents.json for App Icon
const contents = {
    images: [],
    info: {
        version: 1,
        author: "xcode"
    }
};

sizes.forEach(sizeConfig => {
    const actualSize = sizeConfig.size * sizeConfig.scale;
    const canvas = createCanvas(actualSize, actualSize);
    const ctx = canvas.getContext('2d');
    
    drawIcon(ctx, actualSize);
    
    const filename = `AppIcon-${actualSize}@${sizeConfig.scale}x.png`;
    const buffer = canvas.toBuffer('image/png');
    
    // Save image
    fs.writeFileSync(path.join(outputDir, filename), buffer);
    
    // Add to contents.json
    contents.images.push({
        size: `${sizeConfig.size}x${sizeConfig.size}`,
        idiom: sizeConfig.size === 1024 ? "ios-marketing" : "iphone",
        filename: filename,
        scale: `${sizeConfig.scale}x`
    });
    
    console.log(`Generated: ${filename}`);
});

// Save Contents.json
fs.writeFileSync(
    path.join(outputDir, 'Contents.json'),
    JSON.stringify(contents, null, 2)
);

console.log('All icons generated successfully!');
