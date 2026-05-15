/* ============================================
   ENSŌ NO SATO - Script
   ============================================ */

// Gallery data - will be loaded from API
let galleryData = [];

// Fallback gallery data (used if API is not available)
// Gallery data — drinks now live in their own section
const fallbackGalleryData = [];

// Helper to get correct image src (handles Cloudinary URLs and local paths)
function getImageSrc(src) {
    if (src.startsWith('http://') || src.startsWith('https://')) {
        return src;
    }
    return src.startsWith('/') ? src : '/' + src;
}

// Use hardcoded gallery data (no API call needed)
async function loadGalleryData() {
    galleryData = fallbackGalleryData;
    renderGallery();
}

// Render gallery items dynamically
function renderGallery() {
    const container = document.querySelector('.gallery-container');
    if (!container || galleryData.length === 0) return;

    container.innerHTML = galleryData.map(item => `
        <div class="gallery-item">
            <div class="gallery-image-wrapper">
                <img src="${getImageSrc(item.src)}" alt="${item.alt || ''}" class="gallery-image" onclick="openLightbox(this.src)">
                <div class="gallery-haiku">
                    <p class="haiku-text">${item.haiku ? item.haiku.replace(/\n/g, '<br>') : ''}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Smart-parse an experience entry so a single "label" / "price" pair can
// carry a title, a conditions/meta line, a primary price, and a price note
// without requiring schema changes upstream.
function parseExperienceEntry(item) {
    const rawLabel = (item.label || '').trim();
    const rawPrice = (item.price || '').trim();

    const labelMatch = rawLabel.match(/^([^(]+?)\s*\(([^)]+)\)\s*$/);
    const title = labelMatch ? labelMatch[1].trim() : rawLabel;
    const meta = labelMatch ? labelMatch[2].trim() : '';

    const priceHead = /^(\$[\d.,]+(?:\s*[–—-]\s*\$?[\d.,]+)?|À la carte|Market price|MP)/i;
    const headMatch = rawPrice.match(priceHead);
    let priceMain = rawPrice;
    let priceNote = '';
    if (headMatch) {
        priceMain = headMatch[0].trim();
        priceNote = rawPrice.slice(headMatch[0].length).replace(/^\s*[–—-]\s*/, '').trim();
    }

    return { title, meta, priceMain, priceNote };
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

// Load menu data from API and update the DOM
async function loadMenuData() {
    try {
        const response = await fetch('/api/menu');
        const data = await response.json();
        if (data.experiences && data.experiences.length > 0) {
            const activeItems = data.experiences.filter(item => item.active !== false);
            const container = document.querySelector('.experience-list');
            if (container && activeItems.length > 0) {
                container.innerHTML = activeItems.map(item => {
                    const { title, meta, priceMain, priceNote } = parseExperienceEntry(item);
                    return `
                    <div class="experience-item${meta || priceNote ? ' experience-item--rich' : ''}">
                        <div class="experience-content">
                            <span class="experience-label">${escapeHtml(title)}</span>
                            ${meta ? `<span class="experience-meta">${escapeHtml(meta)}</span>` : ''}
                        </div>
                        <div class="experience-pricing">
                            <span class="experience-price">${escapeHtml(priceMain)}</span>
                            ${priceNote ? `<span class="experience-note">${escapeHtml(priceNote)}</span>` : ''}
                        </div>
                    </div>
                `;
                }).join('');
            }
        }
    } catch (error) {
        // Keep existing HTML if API is not available
    }
}

// Load chefs data from API and render
async function loadChefsData() {
    try {
        const response = await fetch('/api/chefs');
        const data = await response.json();
        if (data.chefs && data.chefs.length > 0) {
            const activeChefs = data.chefs.filter(c => c.active !== false);
            renderChefs(activeChefs);
        }
    } catch (error) {
        // Keep coming soon placeholder if API not available
    }
}

function renderChefs(chefs) {
    const container = document.getElementById('chefs-container');
    if (!container || chefs.length === 0) return;

    container.innerHTML = '<div class="chefs-grid">' + chefs.map(chef => `
        <div class="chef-card">
            <div class="chef-photo-wrapper">
                ${chef.photo ? `<img src="${getImageSrc(chef.photo)}" alt="${chef.name}">` : ''}
            </div>
            <h3 class="chef-name">${chef.name}</h3>
            ${chef.role ? `<p class="chef-role">${chef.role}</p>` : ''}
            ${chef.bio ? `<p class="chef-bio">${chef.bio}</p>` : ''}
        </div>
    `).join('') + '</div>';
}

// Experiences are hardcoded in HTML — no API call needed
async function loadExperiencesData() {
    // No-op: interior images are hardcoded in index.html
}

function renderExperiences(items) {
    const container = document.getElementById('experiences-container');
    if (!container || items.length === 0) return;

    container.innerHTML = '<div class="experiences-grid">' + items.map(item => {
        const src = getImageSrc(item.src);
        const alt = (item.alt || '').replace(/'/g, "\\'");
        const caption = (item.caption || '').replace(/'/g, "\\'");
        const media = item.type === 'video'
            ? `<video src="${src}" muted loop playsinline autoplay></video>`
            : `<img src="${src}" alt="${item.alt || ''}" onclick="openMenuLightbox(this.src,'${alt}','${caption}')">`;
        return `
            <div class="experience-media-item">
                ${media}
                ${item.caption ? `<div class="experience-media-caption">${item.caption}</div>` : ''}
            </div>`;
    }).join('') + '</div>';
}

// Hero video is hardcoded in HTML (assets/enso-koi-loop.mp4)
async function loadHeroVideo() {
    // No-op: video src is set directly in index.html
}

// Hours are rendered from static HTML; admin-driven hours are paused.
async function loadHoursData() {}

// Menu item lightbox
function openMenuLightbox(src, name, desc) {
    const lightbox = document.getElementById('menuLightbox');
    document.getElementById('menuLightboxImg').src = src;
    document.getElementById('menuLightboxName').textContent = name;
    document.getElementById('menuLightboxDesc').textContent = desc;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => lightbox.classList.add('active'));
}

function closeMenuLightbox() {
    const lightbox = document.getElementById('menuLightbox');
    lightbox.classList.remove('active');
    setTimeout(() => {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('menuLightbox').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeMenuLightbox();
    });

    // Universal image zoom — any img without its own onclick, excluding logos
    document.addEventListener('click', e => {
        if (e.target.tagName !== 'IMG') return;
        const img = e.target;
        if (img.getAttribute('onclick')) return;
        if (img.classList.contains('logo') || img.classList.contains('footer-logo')) return;
        openMenuLightbox(img.src, img.alt || '', '');
    });
});

let currentImageIndex = 0;

// Open lightbox with animation
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxHaiku = document.getElementById('lightbox-haiku');

    // Find the index of the clicked image (handle both local paths and Cloudinary URLs)
    currentImageIndex = galleryData.findIndex(item => {
        const itemSrc = getImageSrc(item.src);
        return src === itemSrc || src.includes(item.src.split('/').pop());
    });
    if (currentImageIndex === -1) currentImageIndex = 0;

    // Set image and haiku
    lightboxImage.src = src;
    const haiku = galleryData[currentImageIndex].haiku;
    lightboxHaiku.innerHTML = haiku ? haiku.replace(/\n/g, '<br>') : '';
    
    // Show lightbox with animation
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Trigger animation
    requestAnimationFrame(() => {
        lightbox.classList.add('active');
    });
}

// Close lightbox with animation
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    
    setTimeout(() => {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
    }, 500);
}

// Navigate between images
function navigateLightbox(direction) {
    currentImageIndex += direction;
    
    // Loop around
    if (currentImageIndex < 0) currentImageIndex = galleryData.length - 1;
    if (currentImageIndex >= galleryData.length) currentImageIndex = 0;
    
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxHaiku = document.getElementById('lightbox-haiku');
    
    // Fade out
    lightboxImage.style.opacity = '0';
    lightboxHaiku.style.opacity = '0';
    
    setTimeout(() => {
        lightboxImage.src = getImageSrc(galleryData[currentImageIndex].src);
        lightboxHaiku.innerHTML = galleryData[currentImageIndex].haiku ? galleryData[currentImageIndex].haiku.replace(/\n/g, '<br>') : '';

        // Fade in
        lightboxImage.style.opacity = '1';
        lightboxHaiku.style.opacity = '1';
    }, 300);
}

// Close lightbox with Escape key, navigate with arrows
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox.classList.contains('active')) return;
    
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
});

// Close lightbox when clicking outside the content
document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.classList.contains('lightbox')) {
        closeLightbox();
    }
});

(function() {
    'use strict';

    // Video Handler
    function initVideo() {
        const video = document.querySelector('.bg-video');
        if (!video) return;

        // Try to play immediately
        video.play().catch(() => {
            // Autoplay blocked, try on interaction
            ['touchstart', 'click'].forEach(event => {
                document.addEventListener(event, () => video.play(), { once: true });
            });
        });
    }

    // Smooth scroll for anchor links
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // Intersection Observer for fade-in animations
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observe gallery items, info blocks, chef cards, and experience items
        document.querySelectorAll('.gallery-item, .info-block, .chef-card, .experience-media-item, .experiences-coming-soon, .chefs-coming-soon').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // Add visible class styles
    function addVisibleStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .gallery-item.visible, .info-block.visible, .chef-card.visible, .experience-media-item.visible, .experiences-coming-soon.visible, .chefs-coming-soon.visible {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Navigation Menu
    function initNavMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');
        const navClose = document.getElementById('navClose');
        const navOverlay = document.getElementById('navOverlay');
        const navLinks = document.querySelectorAll('.nav-link');

        if (!menuToggle || !navMenu) return;

        function openMenu() {
            menuToggle.classList.add('active');
            navMenu.classList.add('active');
            navOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeMenu() {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
            navOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        menuToggle.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        navClose.addEventListener('click', closeMenu);
        navOverlay.addEventListener('click', closeMenu);

        // Close menu when a nav link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMenu();
            }
        });
    }

    // Initialize
    async function init() {
        // Load data from API (runs in parallel)
        await Promise.all([
            loadGalleryData(),
            loadMenuData(),
            loadHoursData(),
            loadChefsData(),
            loadExperiencesData(),
            loadHeroVideo()
        ]);

        initVideo();
        initSmoothScroll();
        addVisibleStyles();
        initScrollAnimations();
        initNavMenu();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
