# Ensō no Sato - Coming Soon Landing Page

A luxury minimalist landing page for Ensō no Sato, a Japanese omakase and izakaya restaurant.

## 📁 Folder Structure

```
enso-no-sato/
├── index.html          # Main HTML file
├── styles.css          # All styles
├── script.js           # Rotating text & video handling
├── README.md           # This file
└── assets/
    ├── logo.png        # Your restaurant logo (placeholder)
    └── enso-koi-loop.mp4  # Your background video (placeholder)
```

## 🚀 Quick Start

1. **Add your video:**
   - Place your MP4 video file in the `/assets/` folder
   - Rename it to `enso-koi-loop.mp4`
   - Or update the `src` attribute in `index.html` (line ~38)

2. **Add your logo:**
   - Place your logo PNG in the `/assets/` folder
   - Name it `logo.png`
   - Recommended: PNG with transparency, ~400px width

3. **Open in browser:**
   - Simply open `index.html` in any modern browser
   - Or serve via any static file server

## 🎬 Video Requirements

For best results, your background video should be:

| Attribute | Recommendation |
|-----------|----------------|
| Format | MP4 (H.264 codec) |
| Resolution | 1920×1080 or higher |
| Duration | 10-30 seconds |
| File size | Under 15MB for fast loading |
| Content | Subtle movement (koi, water, smoke, etc.) |

The video will:
- Autoplay (muted)
- Loop continuously
- Cover the entire screen
- Have a dark overlay for text readability

## 🔄 Rotating Text Languages

The "Coming Soon" text rotates every 2.5 seconds between:

1. **English:** COMING SOON
2. **Korean:** 곧 오픈합니다
3. **Chinese:** 即将开业
4. **Japanese:** 近日オープン

To modify the rotation interval or add/change languages, edit `script.js` (CONFIG object at the top).

## 🎨 Customization

### Colors
Edit the CSS variables in `styles.css` (`:root` section):

```css
--color-bg-deep: #0a0a0a;           /* Deep black background */
--color-text-primary: #f5f2eb;       /* Warm off-white text */
--color-text-secondary: #c4bfb3;     /* Muted beige */
--color-text-subtle: #8a857a;        /* Stone gray */
```

### Typography
The page uses:
- **Cormorant Garamond** - Elegant serif for English text
- **Noto Serif JP** - Japanese brush-style serif

### Address & Tagline
Edit directly in `index.html` (footer section):
- Line ~87: Tagline text
- Line ~88: Address

## 📱 Responsive Design

The page is fully responsive with breakpoints at:
- 768px (tablet)
- 480px (mobile)

Also includes:
- Reduced motion support (`prefers-reduced-motion`)
- High contrast mode support (`prefers-contrast`)

## ⚠️ Fallbacks

If the video fails to load:
- A dark gradient background is displayed
- You can optionally add a `poster` image (fallback-bg.jpg)

If the logo fails to load:
- It gracefully hides via the `onerror` handler

## 🌐 Browser Support

Works in all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📄 License

All rights reserved. This template was created for Ensō no Sato.
