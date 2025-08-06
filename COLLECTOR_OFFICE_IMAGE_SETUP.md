# Collector Office Image Setup Guide

## Overview
The login page has been customized to include a beautiful split-screen layout featuring the collector office building photo on the left side and the login form on the right side.

## Image Requirements

### File Details
- **Filename**: `collector-office.jpg`
- **Location**: `public/collector-office.jpg`
- **Format**: JPG/JPEG recommended
- **Size**: High resolution (1920x1080 or higher recommended)
- **Content**: The grand government building illuminated in Indian flag colors (saffron, white, green) at night

### Image Description
The image should show:
- A grand, multi-story government building at night
- Illuminated in Indian flag colors:
  - Left wing: Saffron/orange lighting
  - Central section: White and purple lighting
  - Right wing: Green lighting
- People gathered in the foreground
- Text on building facade indicating "जिल्हाधिकारी तथा जिल्हादंडाधिकारी कार्यालय" (District Collector & District Magistrate Office)
- Location: Palghar District

## Setup Instructions

1. **Add the Image File**:
   - Place your collector office image in the `public/` folder
   - Name it exactly: `collector-office.jpg`
   - Ensure the image is high quality and properly cropped

2. **Image Optimization** (Optional but Recommended):
   - Compress the image to reduce file size while maintaining quality
   - Recommended file size: Under 2MB
   - Use tools like TinyPNG or ImageOptim for compression

3. **Fallback Handling**:
   - The login page includes a fallback design if the image doesn't load
   - A gradient background with building icon will be displayed instead
   - No additional setup required for fallback

## Features Added

### Visual Enhancements
- **Split-screen layout**: Image on left (50%), login form on right (50%)
- **Responsive design**: Image hidden on mobile, full-width login form
- **Overlay content**: SARAL Bhoomi branding and building information overlaid on the image
- **Gradient overlays**: Subtle color overlays to enhance text readability

### Multi-language Support
- Building title and subtitle in Marathi, English, and Hindi
- Dynamic text changes based on selected language

### Accessibility
- Proper alt text for screen readers
- High contrast text overlays
- Fallback design for image loading failures

## Customization Options

### Changing the Image
- Simply replace `public/collector-office.jpg` with your new image
- Maintain the same filename for automatic loading

### Adjusting Layout
- Modify the `lg:w-1/2` classes in the JSX to change the split ratio
- Adjust overlay positioning by modifying the `absolute inset-0` classes

### Color Scheme
- The overlay gradients use orange, white, and green to match the Indian flag
- Colors can be adjusted in the `bg-gradient-to-br` classes

## Testing

1. **Desktop View**: 
   - Should show split-screen with image on left, form on right
   - Image should be properly sized and positioned

2. **Mobile View**:
   - Should hide the image and show full-width login form
   - Header should appear above the login form

3. **Image Loading**:
   - Test with and without the image file to verify fallback works
   - Check that overlay text is readable over the image

## Troubleshooting

### Image Not Displaying
- Verify the image file is named exactly `collector-office.jpg`
- Check that the file is in the `public/` folder
- Ensure the image file is not corrupted

### Layout Issues
- Check browser console for any CSS errors
- Verify Tailwind CSS classes are properly applied
- Test on different screen sizes

### Performance Issues
- Optimize image file size if loading is slow
- Consider using WebP format for better compression
- Implement lazy loading if needed for multiple images

## Notes
- The design maintains the existing color scheme and branding
- All existing functionality (login, language switching, demo credentials) remains intact
- The layout is fully responsive and accessible 