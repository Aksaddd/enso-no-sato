const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'enso-no-sato-admin-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/gallery/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
    }
});

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const GALLERY_FILE = path.join(DATA_DIR, 'gallery.json');
const HOURS_FILE = path.join(DATA_DIR, 'hours.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Helper functions to read/write JSON files
function readJSON(filepath) {
    if (!fs.existsSync(filepath)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function writeJSON(filepath, data) {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// Initialize admin account if not exists
function initializeAdmin() {
    if (!fs.existsSync(ADMIN_FILE)) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        writeJSON(ADMIN_FILE, {
            username: 'admin',
            password: hashedPassword
        });
        console.log('Default admin account created. Username: admin, Password: admin123');
        console.log('IMPORTANT: Change this password immediately after first login!');
    }
}

// Initialize data files with current content
function initializeData() {
    // Initialize menu if not exists
    if (!fs.existsSync(MENU_FILE)) {
        writeJSON(MENU_FILE, {
            experiences: [
                { id: 1, label: '18 Course Omakase', price: '$135', active: true },
                { id: 2, label: '12 Course Omakase', price: '$85', active: true },
                { id: 3, label: 'Kitchen & Bar Menu', price: 'À la carte', active: true }
            ]
        });
    }

    // Initialize gallery if not exists
    if (!fs.existsSync(GALLERY_FILE)) {
        writeJSON(GALLERY_FILE, {
            items: [
                { id: 1, src: 'assets/gallery/dish-1.jpg', alt: 'Oyster with caviar and ikura', haiku: "Pearls from the deep sea\nAmber jewels catch the light\nOcean's gift, unveiled", category: 'dish', active: true },
                { id: 2, src: 'assets/gallery/dish-2.jpg', alt: 'Artistic sashimi arrangement', haiku: "Autumn maple falls\nColors bloom upon the plate\nNature's art displayed", category: 'dish', active: true },
                { id: 3, src: 'assets/gallery/dish-3.jpg', alt: 'Scallop presentation on volcanic stone', haiku: "From volcanic stone\nDelicate blooms rise and sway\nEarth cradles the sea", category: 'dish', active: true },
                { id: 4, src: 'assets/gallery/dish-4.jpg', alt: 'Fresh fish selection', haiku: "Morning's first catch rests\nIn cedar, the sea still breathes\nFreshness, unadorned", category: 'dish', active: true },
                { id: 5, src: 'assets/gallery/dish-5.jpg', alt: 'Yakitori on charcoal grill', haiku: "Charcoal whispers low\nSmoke dances, flames embrace meat\nAncient fire, new life", category: 'dish', active: true },
                { id: 6, src: 'assets/gallery/drink-1.jpg', alt: 'Tropical cocktail', haiku: "Paper parasol\nGuards golden nectar below\nSummer in a glass", category: 'drink', active: true },
                { id: 7, src: 'assets/gallery/drink-2.jpg', alt: 'Matcha cocktail', haiku: "Jade light through the glass\nMint and citrus intertwine\nGarden in repose", category: 'drink', active: true },
                { id: 8, src: 'assets/gallery/drink-3.jpg', alt: 'Amber whisky cocktail', haiku: "Moss beneath crystal\nAmber glows like trapped sunlight\nForest spirits wake", category: 'drink', active: true }
            ]
        });
    }

    // Initialize hours if not exists
    if (!fs.existsSync(HOURS_FILE)) {
        writeJSON(HOURS_FILE, {
            izakaya: {
                title: 'Izakaya Bar',
                hours: 'Daily: Noon – 9:30pm'
            },
            omakase: {
                title: 'Omakase',
                lunch: 'Wed – Sun Lunch: 2pm – 4pm',
                dinner: 'Daily Dinner Seatings:',
                seatings: '5:30pm · 7:00pm · 8:00pm'
            }
        });
    }
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
}

// API authentication middleware
function requireAuthAPI(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

// ============================================
// ADMIN ROUTES
// ============================================

// Admin login page
app.get('/admin/login', (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

// Admin login POST
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    const admin = readJSON(ADMIN_FILE);

    if (!admin) {
        return res.status(500).json({ error: 'Admin configuration error' });
    }

    if (username === admin.username && bcrypt.compareSync(password, admin.password)) {
        req.session.isAdmin = true;
        res.json({ success: true, redirect: '/admin' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Admin logout
app.post('/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Admin dashboard
app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Change admin password
app.post('/admin/change-password', requireAuthAPI, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const admin = readJSON(ADMIN_FILE);

    if (!bcrypt.compareSync(currentPassword, admin.password)) {
        return res.status(400).json({ error: 'Current password is incorrect' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    admin.password = bcrypt.hashSync(newPassword, 10);
    writeJSON(ADMIN_FILE, admin);
    res.json({ success: true, message: 'Password changed successfully' });
});

// ============================================
// API ROUTES - Menu/Experiences
// ============================================

// Get all menu items (public)
app.get('/api/menu', (req, res) => {
    const menu = readJSON(MENU_FILE);
    res.json(menu || { experiences: [] });
});

// Update menu item (admin only)
app.put('/api/menu/:id', requireAuthAPI, (req, res) => {
    const menu = readJSON(MENU_FILE);
    const id = parseInt(req.params.id);
    const index = menu.experiences.findIndex(item => item.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Menu item not found' });
    }

    menu.experiences[index] = { ...menu.experiences[index], ...req.body };
    writeJSON(MENU_FILE, menu);
    res.json({ success: true, item: menu.experiences[index] });
});

// Add new menu item (admin only)
app.post('/api/menu', requireAuthAPI, (req, res) => {
    const menu = readJSON(MENU_FILE);
    const newId = Math.max(...menu.experiences.map(i => i.id), 0) + 1;
    const newItem = { id: newId, ...req.body, active: true };
    menu.experiences.push(newItem);
    writeJSON(MENU_FILE, menu);
    res.json({ success: true, item: newItem });
});

// Delete menu item (admin only)
app.delete('/api/menu/:id', requireAuthAPI, (req, res) => {
    const menu = readJSON(MENU_FILE);
    const id = parseInt(req.params.id);
    menu.experiences = menu.experiences.filter(item => item.id !== id);
    writeJSON(MENU_FILE, menu);
    res.json({ success: true });
});

// ============================================
// API ROUTES - Gallery
// ============================================

// Get all gallery items (public)
app.get('/api/gallery', (req, res) => {
    const gallery = readJSON(GALLERY_FILE);
    res.json(gallery || { items: [] });
});

// Update gallery item (admin only)
app.put('/api/gallery/:id', requireAuthAPI, (req, res) => {
    const gallery = readJSON(GALLERY_FILE);
    const id = parseInt(req.params.id);
    const index = gallery.items.findIndex(item => item.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Gallery item not found' });
    }

    gallery.items[index] = { ...gallery.items[index], ...req.body };
    writeJSON(GALLERY_FILE, gallery);
    res.json({ success: true, item: gallery.items[index] });
});

// Add new gallery item with image upload (admin only)
app.post('/api/gallery', requireAuthAPI, upload.single('image'), (req, res) => {
    const gallery = readJSON(GALLERY_FILE);
    const newId = Math.max(...gallery.items.map(i => i.id), 0) + 1;

    const newItem = {
        id: newId,
        src: req.file ? `assets/gallery/${req.file.filename}` : req.body.src,
        alt: req.body.alt || '',
        haiku: req.body.haiku || '',
        category: req.body.category || 'dish',
        active: true
    };

    gallery.items.push(newItem);
    writeJSON(GALLERY_FILE, gallery);
    res.json({ success: true, item: newItem });
});

// Upload new image for existing gallery item (admin only)
app.post('/api/gallery/:id/image', requireAuthAPI, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    const gallery = readJSON(GALLERY_FILE);
    const id = parseInt(req.params.id);
    const index = gallery.items.findIndex(item => item.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Gallery item not found' });
    }

    // Optionally delete old image (if it's not one of the original images)
    const oldSrc = gallery.items[index].src;
    if (oldSrc && !oldSrc.includes('dish-') && !oldSrc.includes('drink-')) {
        const oldPath = path.join(__dirname, oldSrc);
        if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
        }
    }

    gallery.items[index].src = `assets/gallery/${req.file.filename}`;
    writeJSON(GALLERY_FILE, gallery);
    res.json({ success: true, item: gallery.items[index] });
});

// Delete gallery item (admin only)
app.delete('/api/gallery/:id', requireAuthAPI, (req, res) => {
    const gallery = readJSON(GALLERY_FILE);
    const id = parseInt(req.params.id);
    const item = gallery.items.find(i => i.id === id);

    if (item) {
        // Optionally delete the image file (if it's not one of the original images)
        if (item.src && !item.src.includes('dish-') && !item.src.includes('drink-')) {
            const imagePath = path.join(__dirname, item.src);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
    }

    gallery.items = gallery.items.filter(item => item.id !== id);
    writeJSON(GALLERY_FILE, gallery);
    res.json({ success: true });
});

// Reorder gallery items (admin only)
app.post('/api/gallery/reorder', requireAuthAPI, (req, res) => {
    const { order } = req.body; // Array of IDs in new order
    const gallery = readJSON(GALLERY_FILE);

    const reordered = order.map(id => gallery.items.find(item => item.id === id)).filter(Boolean);
    gallery.items = reordered;
    writeJSON(GALLERY_FILE, gallery);
    res.json({ success: true });
});

// ============================================
// API ROUTES - Hours
// ============================================

// Get hours (public)
app.get('/api/hours', (req, res) => {
    const hours = readJSON(HOURS_FILE);
    res.json(hours || {});
});

// Update hours (admin only)
app.put('/api/hours', requireAuthAPI, (req, res) => {
    writeJSON(HOURS_FILE, req.body);
    res.json({ success: true });
});

// ============================================
// Initialize and Start Server
// ============================================

initializeAdmin();
initializeData();

app.listen(PORT, () => {
    console.log(`\n====================================`);
    console.log(`  Ensō no Sato Server Running`);
    console.log(`====================================`);
    console.log(`  Website: http://localhost:${PORT}`);
    console.log(`  Admin:   http://localhost:${PORT}/admin`);
    console.log(`====================================\n`);
});
