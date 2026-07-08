// ========================================
// INTERSECTION OBSERVER — REVEAL ANIMATION
// ========================================

const io = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    },
    {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    }
);

document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// ========================================
// SMOOTH SCROLL
// ========================================

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========================================
// FILTER BUTTONS (Explore Page)
// ========================================

document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        this.classList.add('active');

        // Filter logic here (future implementation)
        console.log('Filter:', this.textContent);
    });
});

// ========================================
// PAGINATION (Jangan dipakai — menghalangi navigasi)
// ========================================
// document.querySelectorAll('.page-btn').forEach((btn) => {
//     btn.addEventListener('click', function (e) {
//         e.preventDefault();
//         document.querySelectorAll('.page-btn').forEach((b) => b.classList.remove('active'));
//         this.classList.add('active');
//     });
// });

// ========================================
// CARD ARTWORK — Seluruh Card Bisa Diklik
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.grid-4 .card, .grid .card, .grid-3 .card');
    
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Jika yang diklik adalah link atau tombol, biarkan berfungsi normal
            if (e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            
            // Cari link "View Artwork" di dalam card
            const link = this.querySelector('a.card-link');
            if (link) {
                window.location.href = link.href;
            }
        });
        
        // Tambahkan cursor pointer agar terlihat bisa diklik
        card.style.cursor = 'pointer';
    });
});

// ========================================
// ACTIVE NAV LINK
// ========================================

const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
        link.classList.add('active');
    }
});

// ========================================
// HAMBURGER MENU — Toggle & Close
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('main-nav');

    if (hamburger && nav) {
        // Toggle menu saat hamburger diklik
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('open');
            nav.classList.toggle('open');
        });

        // Tutup menu saat klik di luar (opsional)
        document.addEventListener('click', function(e) {
            if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('open');
                nav.classList.remove('open');
            }
        });

        // Tutup menu saat klik link di dalam
        nav.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', function() {
                hamburger.classList.remove('open');
                nav.classList.remove('open');
            });
        });
    }
});

// ============================================================
// LIGHTBOX — PREMIUM ZOOM & DRAG
// ============================================================

let currentZoom = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

function openLightbox(imageSrc, imageTitle) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');

    if (!lightbox || !img) return;

    // Reset zoom & position
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    img.style.transform = `scale(${currentZoom}) translate(0px, 0px)`;

    img.src = imageSrc;
    img.alt = imageTitle || 'Artwork';
    caption.textContent = imageTitle || '';

    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
}

// ----- ZOOM FUNCTIONS -----
function zoomIn() {
    const img = document.getElementById('lightbox-img');
    if (!img) return;
    currentZoom = Math.min(currentZoom + 0.25, MAX_ZOOM);
    applyZoom(img);
}

function zoomOut() {
    const img = document.getElementById('lightbox-img');
    if (!img) return;
    currentZoom = Math.max(currentZoom - 0.25, MIN_ZOOM);
    if (currentZoom === 1) {
        translateX = 0;
        translateY = 0;
    }
    applyZoom(img);
}

function resetZoom() {
    const img = document.getElementById('lightbox-img');
    if (!img) return;
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    applyZoom(img);
}

function applyZoom(img) {
    img.style.transform = `scale(${currentZoom}) translate(${translateX}px, ${translateY}px)`;
}

// ----- MOUSE WHEEL ZOOM -----
document.addEventListener('wheel', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('open')) return;

    e.preventDefault();
    const img = document.getElementById('lightbox-img');
    if (!img) return;

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    currentZoom = Math.min(Math.max(currentZoom + delta, MIN_ZOOM), MAX_ZOOM);
    if (currentZoom === 1) {
        translateX = 0;
        translateY = 0;
    }
    applyZoom(img);
}, { passive: false });

// ----- PINCH TO ZOOM (Touch) -----
let lastTouchDistance = 0;
let pinchZoom = 1;

document.addEventListener('touchstart', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('open')) return;

    if (e.touches.length === 2) {
        lastTouchDistance = getTouchDistance(e);
        pinchZoom = currentZoom;
    }
}, { passive: true });

document.addEventListener('touchmove', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('open')) return;

    if (e.touches.length === 2) {
        e.preventDefault();
        const distance = getTouchDistance(e);
        const scale = distance / lastTouchDistance;
        const newZoom = Math.min(Math.max(pinchZoom * scale, MIN_ZOOM), MAX_ZOOM);
        currentZoom = newZoom;
        const img = document.getElementById('lightbox-img');
        if (img) {
            if (currentZoom === 1) {
                translateX = 0;
                translateY = 0;
            }
            applyZoom(img);
        }
    }
}, { passive: false });

function getTouchDistance(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// ----- DRAG IMAGE (Mouse) -----
document.addEventListener('mousedown', function(e) {
    const lightbox = document.getElementById('lightbox');
    const container = document.getElementById('lightbox-container');
    if (!lightbox || !lightbox.classList.contains('open')) return;
    if (currentZoom <= 1) return;
    if (e.target.closest('.lightbox-close') || e.target.closest('.zoom-btn')) return;

    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    container.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    const img = document.getElementById('lightbox-img');
    if (!img) return;

    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    applyZoom(img);
});

document.addEventListener('mouseup', function() {
    const container = document.getElementById('lightbox-container');
    if (isDragging) {
        isDragging = false;
        if (container) container.style.cursor = 'grab';
    }
});

// ----- DRAG IMAGE (Touch) -----
let touchDragStartX = 0, touchDragStartY = 0;
let touchTranslateX = 0, touchTranslateY = 0;

document.addEventListener('touchstart', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('open')) return;
    if (e.touches.length !== 1) return;
    if (currentZoom <= 1) return;

    const touch = e.touches[0];
    touchDragStartX = touch.clientX - translateX;
    touchDragStartY = touch.clientY - translateY;
    touchTranslateX = translateX;
    touchTranslateY = translateY;
}, { passive: true });

document.addEventListener('touchmove', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('open')) return;
    if (e.touches.length !== 1) return;
    if (currentZoom <= 1) return;

    const touch = e.touches[0];
    translateX = touch.clientX - touchDragStartX;
    translateY = touch.clientY - touchDragStartY;
    const img = document.getElementById('lightbox-img');
    if (img) applyZoom(img);
}, { passive: true });

// ----- ESCAPE KEY -----
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});