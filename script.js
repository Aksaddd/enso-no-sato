/* ============================================
   ENSŌ NO SATO - Script
   ============================================ */

// Gallery data - will be loaded from API
let galleryData = [];

// Fallback gallery data (used if API is not available)
const fallbackGalleryData = [
    {
        src: 'assets/gallery/dish-1.jpg',
        haiku: 'Pearls from the deep sea\nAmber jewels catch the light\nOcean\'s gift, unveiled'
    },
    {
        src: 'assets/gallery/dish-2.jpg',
        haiku: 'Autumn maple falls\nColors bloom upon the plate\nNature\'s art displayed'
    },
    {
        src: 'assets/gallery/dish-3.jpg',
        haiku: 'From volcanic stone\nDelicate blooms rise and sway\nEarth cradles the sea'
    },
    {
        src: 'assets/gallery/dish-4.jpg',
        haiku: 'Morning\'s first catch rests\nIn cedar, the sea still breathes\nFreshness, unadorned'
    },
    {
        src: 'assets/gallery/dish-5.jpg',
        haiku: 'Charcoal whispers low\nSmoke dances, flames embrace meat\nAncient fire, new life'
    },
    {
        src: 'assets/gallery/drink-1.jpg',
        haiku: 'Paper parasol\nGuards golden nectar below\nSummer in a glass'
    },
    {
        src: 'assets/gallery/drink-2.jpg',
        haiku: 'Jade light through the glass\nMint and citrus intertwine\nGarden in repose'
    },
    {
        src: 'assets/gallery/drink-3.jpg',
        haiku: 'Moss beneath crystal\nAmber glows like trapped sunlight\nForest spirits wake'
    }
];

// Load gallery data from API
async function loadGalleryData() {
    try {
        const response = await fetch('/api/gallery');
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            // Filter to only active items
            galleryData = data.items.filter(item => item.active !== false);
        } else {
            galleryData = fallbackGalleryData;
        }
    } catch (error) {
        // Use fallback data if API is not available
        galleryData = fallbackGalleryData;
    }
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
                container.innerHTML = activeItems.map(item => `
                    <div class="experience-item">
                        <span class="experience-label">${item.label}</span>
                        <span class="experience-price">${item.price}</span>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        // Keep existing HTML if API is not available
    }
}

// Load hours data from API and update the DOM
async function loadHoursData() {
    try {
        const response = await fetch('/api/hours');
        const data = await response.json();
        const container = document.querySelector('.hours-content');
        if (container && data.izakaya && data.omakase) {
            container.innerHTML = `
                <div class="hours-item">
                    <h4>${data.izakaya.title}</h4>
                    <p>${data.izakaya.hours}</p>
                </div>
                <div class="hours-item">
                    <h4>${data.omakase.title}</h4>
                    <p>${data.omakase.lunch}</p>
                    <p>${data.omakase.dinner}</p>
                    <p>${data.omakase.seatings}</p>
                </div>
            `;
        }
    } catch (error) {
        // Keep existing HTML if API is not available
    }
}

let currentImageIndex = 0;

// Open lightbox with animation
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxHaiku = document.getElementById('lightbox-haiku');
    
    // Find the index of the clicked image
    currentImageIndex = galleryData.findIndex(item => src.includes(item.src.split('/').pop()));
    if (currentImageIndex === -1) currentImageIndex = 0;
    
    // Set image and haiku
    lightboxImage.src = src;
    lightboxHaiku.innerHTML = galleryData[currentImageIndex].haiku.replace(/\n/g, '<br>');
    
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
        lightboxImage.src = galleryData[currentImageIndex].src;
        lightboxHaiku.innerHTML = galleryData[currentImageIndex].haiku.replace(/\n/g, '<br>');
        
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

        // Observe gallery items and info blocks
        document.querySelectorAll('.gallery-item, .info-block').forEach(el => {
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
            .gallery-item.visible, .info-block.visible {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize
    async function init() {
        // Load data from API (runs in parallel)
        await Promise.all([
            loadGalleryData(),
            loadMenuData(),
            loadHoursData()
        ]);

        initVideo();
        initSmoothScroll();
        addVisibleStyles();
        initScrollAnimations();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
