# Ensō no Sato - Restaurant Website with Admin Portal

A luxury minimalist website for Ensō no Sato, a Japanese omakase and izakaya restaurant. Features a dynamic landing page with an admin portal for managing menu items, gallery, and business hours.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Image Storage:** Cloudinary (cloud-based image hosting)
- **Session Store:** connect-mongo (MongoDB-backed sessions)
- **Deployment:** Vercel (serverless)
- **Authentication:** bcryptjs for password hashing

## Features

### Public Website
- Elegant single-page site with a full-screen hero video background
- Menu sections: Omakase, From the Kitchen, Cocktails, Happy Hour, Lunch & Brunch
- Photo gallery / experiences, restaurant story, hours, and private events
- Reservations via Resy and online ordering via Toast
- Fully responsive design for all devices
- Menu prices and hours can be driven dynamically from the database

### Admin Portal (`/admin`)
- Secure login authentication
- **Menu Management:** Add, edit, delete menu/experience items with prices
- **Gallery Management:** Upload images, add haikus, categorize as dish/drink
- **Hours Management:** Update business hours for Izakaya Bar and Omakase
- **Chefs & Experience Media:** Manage chef profiles and experience photos/video
- **Hero Video:** Update the landing-page background video
- **Password Change:** Secure password update functionality

## Project Structure

Everything the live site needs is at the repo root or inside `assets/`, `admin/`,
and `tools/` (these are the only paths Vercel deploys — see `vercel.json`).
Design/working files live in `design-source/` and are **not** deployed.

```
enso-no-sato/
├── index.html              # Main landing page (all public content/sections)
├── styles.css              # Global styles + design tokens (CSS variables)
├── script.js               # Frontend JS (loads menu/gallery from API, hero video, nav)
├── server.js               # Express backend: API routes, admin auth, MongoDB models
├── package.json            # Node.js dependencies & scripts
├── vercel.json             # Vercel build + routing config
├── .env.example            # Template for required environment variables
├── .env                    # Real environment variables (git-ignored, not in repo)
│
├── admin/                  # Admin CMS (served statically, gated by server.js auth)
│   ├── login.html          #   Admin login page
│   └── dashboard.html      #   Admin dashboard (menu / gallery / hours / chefs)
│
├── assets/                 # Everything served to the browser
│   ├── logo.png            #   Restaurant logo (used site-wide)
│   ├── favicon.svg         #   Favicon
│   └── gallery/            #   Gallery & experience photos
│       └── archive/        #     Retired images, kept out of the way
│
├── tools/                  # Internal utilities
│   └── compress-video.html #   Browser-based video compressor
│
└── design-source/          # Brand/design working files — NOT used by the site
    ├── README.md           #   Explains what's in here
    └── ...                 #   Logo exports, brand PDF, WIP graphics
```

> The hero background video is hosted externally (Cloudflare R2) and referenced
> by URL in `index.html` — it is not stored in the repo.

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aksaddd/enso-no-sato.git
   cd enso-no-sato
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/enso-no-sato
   SESSION_SECRET=your-secret-key-here
   NODE_ENV=development
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Access the site:**
   - Website: http://localhost:3000
   - Admin: http://localhost:3000/admin

### Default Admin Credentials
- **Username:** admin
- **Password:** admin123

**Important:** Change the password immediately after first login!

## Vercel Deployment

### Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `SESSION_SECRET` | Random secret for session encryption |
| `NODE_ENV` | Set to `production` |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

### Cloudinary Setup (Image Storage)

Cloudinary provides persistent cloud storage for gallery images uploaded via the admin panel.

1. Create a free account at [Cloudinary](https://cloudinary.com)
2. From your dashboard, get your credentials:
   - **Cloud Name** (e.g., `dzkqzvmsx`)
   - **API Key** (e.g., `111598958316125`)
   - **API Secret** (e.g., `O0a78UMQrdL...`)
3. Add these as environment variables in Vercel

**Why Cloudinary?**
- Vercel's serverless functions have an ephemeral filesystem
- Without cloud storage, uploaded images would disappear after deployment
- Cloudinary provides permanent storage with automatic image optimization
- Free tier includes 25GB storage and 25GB bandwidth/month

### MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write access
3. Whitelist all IPs: `0.0.0.0/0` (for Vercel's dynamic IPs)
4. Get the connection string and add to Vercel env vars

### Custom Domain Configuration

When using a custom domain with Vercel:

1. In Vercel → Settings → Domains, add your domain
2. Configure DNS at your registrar:
   - **www subdomain:** CNAME → `cname.vercel-dns.com`
   - **Root domain:** A record → `76.76.21.21`
3. Ensure the domain is set to "Connect to an environment" (not redirect)

## API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all menu items |
| GET | `/api/gallery` | Get all gallery items |
| GET | `/api/hours` | Get business hours |

### Protected Endpoints (require authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/login` | Admin login |
| POST | `/admin/logout` | Admin logout |
| GET | `/api/auth/check` | Check authentication status |
| PUT | `/api/menu/:id` | Update menu item |
| POST | `/api/menu` | Create menu item |
| DELETE | `/api/menu/:id` | Delete menu item |
| PUT | `/api/gallery/:id` | Update gallery item |
| POST | `/api/gallery` | Create gallery item |
| DELETE | `/api/gallery/:id` | Delete gallery item |
| PUT | `/api/hours` | Update business hours |
| POST | `/admin/change-password` | Change admin password |

## Technical Notes

### Session Handling on Vercel

Vercel runs serverless functions, which required special handling for sessions:

1. **Trust Proxy:** `app.set('trust proxy', 1)` - Required for secure cookies behind Vercel's reverse proxy

2. **Explicit Session Save:** Sessions are explicitly saved before responding to ensure they persist to MongoDB before the function terminates

3. **No-Cache Headers:** Login endpoint sets `Cache-Control: no-store` to prevent Vercel's edge network from stripping Set-Cookie headers

4. **MongoDB Session Store:** Sessions are stored in MongoDB (not memory) so they persist across serverless function invocations

### Cookie Configuration

```javascript
cookie: {
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: 'lax',                                 // CSRF protection
    maxAge: 24 * 60 * 60 * 1000                     // 24 hours
}
```

### Image Upload Flow (Cloudinary)

When an image is uploaded through the admin panel:

1. Image is sent to the server via multipart form data
2. Multer middleware with CloudinaryStorage processes the upload
3. Image is uploaded directly to Cloudinary with automatic optimization:
   - Max dimensions: 1200x1200 (preserving aspect ratio)
   - Quality: auto (Cloudinary optimizes based on content)
   - Formats: jpg, jpeg, png, webp supported
4. Cloudinary returns a permanent URL (e.g., `https://res.cloudinary.com/...`)
5. URL is stored in MongoDB
6. Public website and admin panel display images via Cloudinary CDN

## Customization

### Colors
Edit CSS variables in `styles.css`:
```css
--color-bg-deep: #0a0a0a;           /* Deep black background */
--color-text-primary: #f5f2eb;       /* Warm off-white text */
--color-text-secondary: #c4bfb3;     /* Muted beige */
--color-accent: #d4af37;             /* Gold accent */
```

### Typography
- **Cormorant Garamond** - Elegant serif for English text
- **Noto Serif JP** - Japanese brush-style serif

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

All rights reserved. Created for Ensō no Sato restaurant.
