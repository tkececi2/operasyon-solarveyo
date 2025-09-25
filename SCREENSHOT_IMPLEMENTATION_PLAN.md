# Screenshot Implementation Plan

## Overview
This document outlines the plan for implementing actual screenshots in the marketing pages to showcase the SolarVeyo platform capabilities.

## Current State
The marketing pages currently use placeholder elements that represent where screenshots will be displayed. These placeholders include:
- Dashboard preview in the Hero section
- Feature showcase sections with "Örnek Ekran Görüntüsü" placeholders
- Dashboard features visualization

## Implementation Steps

### 1. Capture Actual Screenshots
Take screenshots of the following key pages:
1. **Dashboard** - Main overview with KPI cards and charts
2. **Arıza Yönetimi** - Fault management interface with table and filters
3. **Bakım Planlama** - Maintenance planning interface
4. **Stok Yönetimi** - Inventory management with alerts
5. **Saha Yönetimi** - Site management with map view
6. **Ekip Yönetimi** - Team management interface
7. **Vardiya Bildirimleri** - Shift notifications

### 2. Optimize Screenshots
- Resize images to appropriate dimensions (recommended: 800x600px)
- Add annotations or highlights to key features
- Ensure sensitive data is redacted
- Compress images for web use

### 3. Organize Screenshots
Place optimized screenshots in the `public/screenshots/` directory with descriptive names:
- `dashboard.png`
- `ariza-yonetimi.png`
- `bakim-planlama.png`
- `stok-yonetimi.png`
- `saha-yonetimi.png`
- `ekip-yonetimi.png`
- `vardiya-bildirimleri.png`

### 4. Update Marketing Pages
Replace the placeholder elements with actual image tags:

```jsx
// In FeatureShowcase component
<div className="border border-gray-200 rounded-lg overflow-hidden">
  <img 
    src={`/screenshots/${feature.image}`} 
    alt={`${feature.title} arayüzü`} 
    className="w-full h-auto"
  />
</div>
```

### 5. Add Lightbox Functionality (Optional)
Implement a lightbox component to allow users to view larger versions of screenshots when clicked.

## Suggested Screenshot Descriptions

### Dashboard.png
- Show KPI cards with real data
- Display fault status chart
- Include quick access buttons
- Highlight recent activity feed

### Ariza-Yonetimi.png
- Fault listing table with columns
- Filter and search controls
- Status badges and priority indicators
- Action buttons (edit, view, delete)

### Bakim-Planlama.png
- Maintenance schedule calendar view
- Work order creation form
- Equipment selection dropdowns
- Assignment and notification controls

### Stok-Yonetimi.png
- Inventory listing with quantities
- Critical stock level warnings
- Filter by category or status
- Add/edit stock item form

### Saha-Yonetimi.png
- Map view with site markers
- Site details panel
- Add/edit site form
- Coordinate display

### Ekip-Yonetimi.png
- Team member listing
- Role assignment controls
- Contact information display
- Add/remove team member functionality

### Vardiya-Bildirimleri.png
- Shift schedule calendar
- Notification settings panel
- Message composition interface
- Recipient selection

## Technical Considerations

1. **Responsive Design**: Ensure screenshots display properly on all device sizes
2. **Loading Performance**: Optimize image sizes to maintain fast page load times
3. **Accessibility**: Add appropriate alt text for screen readers
4. **Localization**: Consider if screenshots need to be updated for different languages

## Next Steps

1. Capture and optimize screenshots for each key feature
2. Upload to the `public/screenshots/` directory
3. Update the marketing pages to use actual images instead of placeholders
4. Test across different devices and browsers
5. Gather feedback from stakeholders