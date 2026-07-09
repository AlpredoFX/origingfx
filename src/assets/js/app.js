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

// ============================================================
// THEME TOGGLE — DENGAN ANIMASI TRANSISI
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    const html = document.documentElement;

    // Icon SVG
    const sunIcon = `
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    `;

    const moonIcon = `
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-linejoin="round"/>
    `;
    // Fungsi set tema dengan animasi
    function setTheme(theme, animate = true) {
        const isDark = theme === 'dark';
        
        // Animasi ikon
        if (animate) {
            icon.classList.remove('morphing');
            // Force reflow
            void icon.offsetHeight;
            icon.classList.add('morphing');
        }

        // Hapus semua class
        html.classList.remove('light-mode', 'dark-mode', 'manual-theme');

        // Tambah class baru
        if (isDark) {
            html.classList.add('dark-mode', 'manual-theme');
            icon.innerHTML = sunIcon;
            toggle.setAttribute('aria-label', 'Switch to light mode');
        } else {
            html.classList.add('light-mode', 'manual-theme');
            icon.innerHTML = moonIcon;
            toggle.setAttribute('aria-label', 'Switch to dark mode');
        }

        localStorage.setItem('theme', theme);
    }

    // Inisialisasi tema
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme) {
        setTheme(storedTheme, false);
    } else {
        if (prefersDark) {
            setTheme('dark', false);
        } else {
            setTheme('light', false);
        }
        html.classList.remove('manual-theme');
    }

    // Event listener toggle
    toggle.addEventListener('click', function(e) {
        e.stopPropagation();

        const isDark = html.classList.contains('dark-mode');
        const newTheme = isDark ? 'light' : 'dark';
        
        // Tambah efek klik
        this.style.transform = 'scale(0.92)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);

        setTheme(newTheme, true);
    });

    // Reset animasi ikon setelah selesai
    icon.addEventListener('animationend', function() {
        this.classList.remove('morphing');
    });

    // Auto follow system (jika belum manual)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                setTheme('dark', true);
            } else {
                setTheme('light', true);
            }
            html.classList.remove('manual-theme');
        }
    });
});

// ============================================================
// PAGE TRANSITIONS — FALLBACK (Jika View Transitions Tidak Didukung)
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah View Transitions didukung
    const supportsViewTransition = 'startViewTransition' in document;

    if (!supportsViewTransition) {
        // Jika tidak didukung, tambahkan animasi fade-in untuk semua konten
        const main = document.querySelector('main');
        if (main) {
            main.style.opacity = '0';
            main.style.transform = 'translateY(12px)';
            main.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

            requestAnimationFrame(() => {
                main.style.opacity = '1';
                main.style.transform = 'translateY(0)';
            });
        }
    }
});

// ============================================================
// INTERCEPT NAVIGATION — Pakai View Transition
// ============================================================

document.addEventListener('click', function(e) {
    // Cari link internal (bukan external, bukan #anchor)
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;

    // Cegah navigasi default, pakai View Transition
    if ('startViewTransition' in document) {
        e.preventDefault();
        const targetUrl = link.href;

        document.startViewTransition(() => {
            window.location.href = targetUrl;
        });
    }
    // Kalau tidak support, biarkan navigasi normal
});