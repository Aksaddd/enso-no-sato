require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for Vercel (secure cookies behind reverse proxy)
app.set('trust proxy', 1);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/enso-no-sato';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Mongoose Schemas
const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const menuItemSchema = new mongoose.Schema({
    label: { type: String, required: true },
    price: { type: String, required: true },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
});

const galleryItemSchema = new mongoose.Schema({
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    haiku: { type: String, default: '' },
    category: { type: String, enum: ['dish', 'drink'], default: 'dish' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
});

const hoursSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    izakaya: {
        title: { type: String, default: 'Izakaya Bar' },
        hours: { type: String, default: '' }
    },
    omakase: {
        title: { type: String, default: 'Omakase' },
        lunch: { type: String, default: '' },
        dinner: { type: String, default: '' },
        seatings: { type: String, default: '' }
    }
});

const Admin = mongoose.model('Admin', adminSchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const GalleryItem = mongoose.model('GalleryItem', galleryItemSchema);
const Hours = mongoose.model('Hours', hoursSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Session configuration with MongoDB store
app.use(session({
    secret: process.env.SESSION_SECRET || 'enso-no-sato-admin-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer configuration with Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'enso-no-sato/gallery',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

// Initialize default data
async function initializeData() {
    try {
        // Create default admin if not exists
        const adminExists = await Admin.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            await Admin.create({ username: 'admin', password: hashedPassword });
            console.log('Default admin account created. Username: admin, Password: admin123');
            console.log('IMPORTANT: Change this password immediately after first login!');
        }

        // Create default menu items if none exist
        const menuCount = await MenuItem.countDocuments();
        if (menuCount === 0) {
            await MenuItem.insertMany([
                { label: '18 Course Omakase', price: '$135', active: true, order: 1 },
                { label: '12 Course Omakase', price: '$85', active: true, order: 2 },
                { label: 'Kitchen & Bar Menu', price: 'À la carte', active: true, order: 3 }
            ]);
            console.log('Default menu items created');
        }

        // Create default gallery items if none exist
        const galleryCount = await GalleryItem.countDocuments();
        if (galleryCount === 0) {
            await GalleryItem.insertMany([
                { src: 'assets/gallery/dish-1.jpg', alt: 'Oyster with caviar and ikura', haiku: "Pearls from the deep sea\nAmber jewels catch the light\nOcean's gift, unveiled", category: 'dish', active: true, order: 1 },
                { src: 'assets/gallery/dish-2.jpg', alt: 'Artistic sashimi arrangement', haiku: "Autumn maple falls\nColors bloom upon the plate\nNature's art displayed", category: 'dish', active: true, order: 2 },
                { src: 'assets/gallery/dish-3.jpg', alt: 'Scallop presentation on volcanic stone', haiku: "From volcanic stone\nDelicate blooms rise and sway\nEarth cradles the sea", category: 'dish', active: true, order: 3 },
                { src: 'assets/gallery/dish-4.jpg', alt: 'Fresh fish selection', haiku: "Morning's first catch rests\nIn cedar, the sea still breathes\nFreshness, unadorned", category: 'dish', active: true, order: 4 },
                { src: 'assets/gallery/dish-5.jpg', alt: 'Yakitori on charcoal grill', haiku: "Charcoal whispers low\nSmoke dances, flames embrace meat\nAncient fire, new life", category: 'dish', active: true, order: 5 },
                { src: 'assets/gallery/drink-1.jpg', alt: 'Tropical cocktail', haiku: "Paper parasol\nGuards golden nectar below\nSummer in a glass", category: 'drink', active: true, order: 6 },
                { src: 'assets/gallery/drink-2.jpg', alt: 'Matcha cocktail', haiku: "Jade light through the glass\nMint and citrus intertwine\nGarden in repose", category: 'drink', active: true, order: 7 },
                { src: 'assets/gallery/drink-3.jpg', alt: 'Amber whisky cocktail', haiku: "Moss beneath crystal\nAmber glows like trapped sunlight\nForest spirits wake", category: 'drink', active: true, order: 8 }
            ]);
            console.log('Default gallery items created');
        }

        // Create default hours if not exists
        const hoursExists = await Hours.findOne({ key: 'main' });
        if (!hoursExists) {
            await Hours.create({
                key: 'main',
                izakaya: { title: 'Izakaya Bar', hours: 'Daily: Noon – 9:30pm' },
                omakase: { title: 'Omakase', lunch: 'Wed – Sun Lunch: 2pm – 4pm', dinner: 'Daily Dinner Seatings:', seatings: '5:30pm · 7:00pm · 8:00pm' }
            });
            console.log('Default hours created');
        }
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
}

function requireAuthAPI(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

// ============================================
// ADMIN ROUTES
// ============================================

app.get('/admin/login', (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.redirect('/admin');
    }
    res.redirect('/admin/login.html');
});

app.post('/admin/login', async (req, res) => {
    // Prevent caching - required for Set-Cookie to work on Vercel edge
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (bcrypt.compareSync(password, admin.password)) {
            req.session.isAdmin = true;
            // Explicitly save session before responding (required for serverless)
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ error: 'Session error' });
                }
                res.json({ success: true, redirect: '/admin' });
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Check auth status API (for dashboard to verify session)
app.get('/api/auth/check', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

app.get('/admin', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.redirect('/admin/dashboard.html');
    } else {
        res.redirect('/admin/login');
    }
});

app.post('/admin/change-password', requireAuthAPI, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const admin = await Admin.findOne({ username: 'admin' });

        if (!bcrypt.compareSync(currentPassword, admin.password)) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        admin.password = bcrypt.hashSync(newPassword, 10);
        await admin.save();
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// API ROUTES - Menu
// ============================================

app.get('/api/menu', async (req, res) => {
    try {
        const items = await MenuItem.find().sort({ order: 1 });
        res.json({ experiences: items });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/menu/:id', requireAuthAPI, async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json({ success: true, item });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/menu', requireAuthAPI, async (req, res) => {
    try {
        const maxOrder = await MenuItem.findOne().sort({ order: -1 });
        const newOrder = maxOrder ? maxOrder.order + 1 : 1;
        const item = await MenuItem.create({ ...req.body, order: newOrder });
        res.json({ success: true, item });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/menu/:id', requireAuthAPI, async (req, res) => {
    try {
        await MenuItem.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// API ROUTES - Gallery
// ============================================

app.get('/api/gallery', async (req, res) => {
    try {
        const items = await GalleryItem.find().sort({ order: 1 });
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/gallery/:id', requireAuthAPI, async (req, res) => {
    try {
        const item = await GalleryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }
        res.json({ success: true, item });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/gallery', requireAuthAPI, upload.single('image'), async (req, res) => {
    try {
        const maxOrder = await GalleryItem.findOne().sort({ order: -1 });
        const newOrder = maxOrder ? maxOrder.order + 1 : 1;

        const itemData = {
            src: req.file ? req.file.path : req.body.src, // Cloudinary URL
            alt: req.body.alt || '',
            haiku: req.body.haiku || '',
            category: req.body.category || 'dish',
            active: true,
            order: newOrder
        };

        const item = await GalleryItem.create(itemData);
        res.json({ success: true, item });
    } catch (error) {
        console.error('Gallery create error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/gallery/:id/image', requireAuthAPI, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const item = await GalleryItem.findByIdAndUpdate(
            req.params.id,
            { src: req.file.path }, // Cloudinary URL
            { new: true }
        );

        if (!item) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }

        res.json({ success: true, item });
    } catch (error) {
        console.error('Gallery image update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/gallery/:id', requireAuthAPI, async (req, res) => {
    try {
        await GalleryItem.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/gallery/reorder', requireAuthAPI, async (req, res) => {
    try {
        const { order } = req.body;
        for (let i = 0; i < order.length; i++) {
            await GalleryItem.findByIdAndUpdate(order[i], { order: i + 1 });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// API ROUTES - Hours
// ============================================

app.get('/api/hours', async (req, res) => {
    try {
        const hours = await Hours.findOne({ key: 'main' });
        if (hours) {
            res.json({ izakaya: hours.izakaya, omakase: hours.omakase });
        } else {
            res.json({});
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/hours', requireAuthAPI, async (req, res) => {
    try {
        await Hours.findOneAndUpdate(
            { key: 'main' },
            { izakaya: req.body.izakaya, omakase: req.body.omakase },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// MAIN ROUTES
// ============================================

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// Initialize and Start Server
// ============================================

mongoose.connection.once('open', () => {
    initializeData();
});

app.listen(PORT, () => {
    console.log(`\n====================================`);
    console.log(`  Ensō no Sato Server Running`);
    console.log(`====================================`);
    console.log(`  Website: http://localhost:${PORT}`);
    console.log(`  Admin:   http://localhost:${PORT}/admin`);
    console.log(`====================================\n`);
});

// Export for Vercel
module.exports = app;
