# Ensō no Sato - Restaurant Website with Admin Portal

A luxury minimalist website for Ensō no Sato, a Japanese omakase and izakaya restaurant. Features a dynamic landing page with an admin portal for managing menu items, gallery, and business hours.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Session Store:** connect-mongo (MongoDB-backed sessions)
- **Deployment:** Vercel (serverless)
- **Authentication:** bcryptjs for password hashing

## Features

### Public Website
- Elegant landing page with video background
- Rotating "Coming Soon" text in multiple languages (English, Korean, Chinese, Japanese)
- Responsive design for all devices
- Dynamic menu and gallery loaded from database

### Admin Portal (`/admin`)
- Secure login authentication
- **Menu Management:** Add, edit, delete menu items with prices
- **Gallery Management:** Upload images, add haikus, categorize as dish/drink
- **Hours Management:** Update business hours for Izakaya Bar and Omakase
- **Password Change:** Secure password update functionality

## Project Structure

```
enso-no-sato/
├── index.html              # Main landing page
├── styles.css              # Global styles
├── script.js               # Frontend JavaScript
├── server.js               # Express backend server
├── package.json            # Node.js dependencies
├── vercel.json             # Vercel deployment config
├── .env                    # Environment variables (not in repo)
├── admin/
│   ├── login.html          # Admin login page
│   └── dashboard.html      # Admin dashboard
└── assets/
    ├── logo.png            # Restaurant logo
    ├── enso-koi-loop.mp4   # Background video
    └── gallery/            # Gallery images
```

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
