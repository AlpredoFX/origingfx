// ============================================================
// ORIGINGFX — MAIN JAVASCRIPT (FINAL)
// ============================================================

// ============================================================
// 1. INTERSECTION OBSERVER — REVEAL DENGAN STAGGER
// ============================================================

const revealElements = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const delay = parseFloat(el.getAttribute('data-delay')) || 0;
                setTimeout(() => {
                    el.classList.add('visible');
                }, delay * 1000);
                observer.unobserve(el);
            }
        });
    },
    {
        threshold: 0.05,
        rootMargin: '0px 0px -10px 0px'
    }
);

revealElements.forEach((el, index) => {
    if (!el.hasAttribute('data-delay')) {
        const staggerBase = 0.05;
        const staggerStep = 0.06;
        el.setAttribute('data-delay', (staggerBase + index * staggerStep).toFixed(2));
    }
    observer.observe(el);
});

// ========================================
// 2. SMOOTH SCROLL (anchor link #)
// ========================================

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ============================================================
// 3. EXPLORE: FILTER + LOAD MORE (FINAL)
// ============================================================

let activeCategory = 'All';

// --- FUNGSI FILTER (update display & counter) ---
function applyFilter() {
    const cards = document.querySelectorAll('#explore-grid .card');
    let visibleCount = 0;
    let totalMatching = 0;

    cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        const isMatch = (activeCategory === 'All' || cat === activeCategory);
        if (isMatch) {
            totalMatching++;
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const infoText = document.querySelector('.explore-info');
    if (infoText) {
        infoText.textContent = `Showing ${visibleCount} of ${totalMatching} artworks`;
    }
}

// --- FILTER BUTTONS ---
document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeCategory = this.textContent.trim();
        applyFilter();

        const loadBtn = document.getElementById('load-more-btn');
        if (loadBtn && loadBtn.dataset.nextPage) {
            loadBtn.style.display = 'inline-block';
        } else if (loadBtn) {
            loadBtn.style.display = 'none';
        }
    });
});

// --- LOAD MORE ---
function initLoadMore() {
    const loadBtn = document.getElementById('load-more-btn');
    if (!loadBtn) return;

    const grid = document.getElementById('explore-grid');
    if (!grid) return;

    let nextPageUrl = loadBtn.dataset.nextPage;

    function loadMore() {
        if (!nextPageUrl) {
            loadBtn.style.display = 'none';
            return;
        }

        fetch(nextPageUrl)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const newCards = doc.querySelectorAll('#explore-grid .card');
                if (newCards.length === 0) {
                    loadBtn.style.display = 'none';
                    return;
                }

                newCards.forEach(card => {
                    grid.appendChild(card);
                });

                const newBtn = doc.querySelector('#load-more-btn');
                if (newBtn && newBtn.dataset.nextPage) {
                    nextPageUrl = newBtn.dataset.nextPage;
                } else {
                    nextPageUrl = null;
                    loadBtn.style.display = 'none';
                }

                applyFilter();

                if (nextPageUrl) {
                    loadBtn.style.display = 'inline-block';
                } else {
                    loadBtn.style.display = 'none';
                }
            })
            .catch(err => {
                console.error('Load More failed:', err);
                loadBtn.style.display = 'none';
            });
    }

    // Ganti tombol dengan clone untuk hapus event listener lama
    const newLoadBtn = loadBtn.cloneNode(true);
    loadBtn.parentNode.replaceChild(newLoadBtn, loadBtn);
    newLoadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        loadMore();
    });

    // Jalankan filter pertama kali
    applyFilter();
}

// Panggil initLoadMore di dalam DOMContentLoaded (pastikan hanya sekali)
// Jika sudah ada, hapus panggilan ganda.

// ========================================
// 4. ACTIVE NAV LINK
// ========================================

const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
        link.classList.add('active');
    }
});

// ============================================================
// 5. LIGHTBOX — PREMIUM ZOOM & DRAG (GLOBAL)
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
    if (currentZoom === 1) { translateX = 0; translateY = 0; }
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

// Mouse Wheel Zoom
document.addEventListener('wheel', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('open')) return;
    e.preventDefault();
    const img = document.getElementById('lightbox-img');
    if (!img) return;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    currentZoom = Math.min(Math.max(currentZoom + delta, MIN_ZOOM), MAX_ZOOM);
    if (currentZoom === 1) { translateX = 0; translateY = 0; }
    applyZoom(img);
}, { passive: false });

// Pinch to Zoom (Touch)
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
            if (currentZoom === 1) { translateX = 0; translateY = 0; }
            applyZoom(img);
        }
    }
}, { passive: false });

function getTouchDistance(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// Drag Image (Mouse)
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

// Drag Image (Touch)
let touchDragStartX = 0, touchDragStartY = 0;

document.addEventListener('touchstart', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('open')) return;
    if (e.touches.length !== 1) return;
    if (currentZoom <= 1) return;
    const touch = e.touches[0];
    touchDragStartX = touch.clientX - translateX;
    touchDragStartY = touch.clientY - translateY;
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

// Escape Key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// ============================================================
// 6. DOMContentLoaded — SEMUA INISIALISASI DALAM SATU BLOK
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    const html = document.documentElement;

    // --- A. CARD ARTWORK (klik seluruh card) ---
    const cards = document.querySelectorAll('.grid-4 .card, .grid .card, .grid-3 .card');
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('a') || e.target.closest('button')) return;
            const link = this.querySelector('a.card-link');
            if (link) window.location.href = link.href;
        });
        card.style.cursor = 'pointer';
    });

    // --- B. HAMBURGER MENU ---
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('main-nav');
    if (hamburger && nav) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('open');
            nav.classList.toggle('open');
        });
        document.addEventListener('click', function(e) {
            if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('open');
                nav.classList.remove('open');
            }
        });
        nav.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', function() {
                hamburger.classList.remove('open');
                nav.classList.remove('open');
            });
        });
    }

    // --- C. THEME TOGGLE ---
    const toggle = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    if (toggle && icon) {
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

        function setTheme(theme, animate = true) {
            const isDark = theme === 'dark';
            if (animate) {
                icon.classList.remove('morphing');
                void icon.offsetHeight;
                icon.classList.add('morphing');
            }
            html.classList.remove('light-mode', 'dark-mode', 'manual-theme');
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

        const storedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (storedTheme) {
            setTheme(storedTheme, false);
        } else {
            setTheme(prefersDark ? 'dark' : 'light', false);
            html.classList.remove('manual-theme');
        }

        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const isDark = html.classList.contains('dark-mode');
            const newTheme = isDark ? 'light' : 'dark';
            this.style.transform = 'scale(0.92)';
            setTimeout(() => { this.style.transform = ''; }, 150);
            setTheme(newTheme, true);
        });

        icon.addEventListener('animationend', function() {
            this.classList.remove('morphing');
        });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches ? 'dark' : 'light', true);
                html.classList.remove('manual-theme');
            }
        });
    }

    // --- D. PAGE TRANSITIONS (hindari animasi saat refresh) ---
    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry && navEntry.type === 'navigate') {
        html.classList.add('no-animation');
        setTimeout(() => {
            html.classList.remove('no-animation');
        }, 100);
    }

    // --- E. LOAD MORE — EXPLORE PAGE ---
    const loadBtnExplore = document.getElementById('load-more-btn');
    if (loadBtnExplore) {
        const grid = document.getElementById('explore-grid');
        const infoText = document.querySelector('.explore-info');
        if (grid && infoText) {
            let nextPageUrl = loadBtnExplore.dataset.nextPage;
            const totalArtworks = parseInt(infoText.textContent.match(/\d+ of (\d+)/)?.[1] || 0);

            function updateCounter(currentCount, total) {
                if (infoText) {
                    infoText.textContent = `Showing ${currentCount} of ${total} artworks`;
                }
            }

            loadBtnExplore.addEventListener('click', function() {
                if (!nextPageUrl) {
                    this.style.display = 'none';
                    return;
                }
                fetch(nextPageUrl)
                    .then(response => response.text())
                    .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const newCards = doc.querySelectorAll('#explore-grid .card');
                        if (newCards.length === 0) {
                            this.style.display = 'none';
                            return;
                        }
                        newCards.forEach(card => grid.appendChild(card));
                        const newBtn = doc.querySelector('#load-more-btn');
                        if (newBtn && newBtn.dataset.nextPage) {
                            nextPageUrl = newBtn.dataset.nextPage;
                        } else {
                            nextPageUrl = null;
                            this.style.display = 'none';
                        }
                        const currentCount = grid.querySelectorAll('.card').length;
                        updateCounter(currentCount, totalArtworks);
                        // TAMBAHKAN: Jika sudah mencapai total, sembunyikan tombol
                        if (currentCount >= totalArtworks) {
                            this.style.display = 'none';
                        }
                    })
                    .catch(err => {
                        console.error('Load More Explore failed:', err);
                        this.style.display = 'none';
                    });
            });
        }
    }

    // --- F. LOAD MORE — ARTIST PROFILE (artwork-card) ---
    const loadBtnArtist = document.getElementById('load-more-btn');
    // Perhatikan: ID sama dengan explore, jadi kita perlu bedakan dengan konteks.
    // Tetapi karena di artist profile ada .artwork-card, kita bisa cek apakah ada card tersebut.
    // Jika ada, kita inisialisasi load more untuk artist profile.
    const artistCards = document.querySelectorAll('.artwork-card');
    if (artistCards.length > 0 && loadBtnArtist) {
        // Pastikan tombol ini adalah untuk artist (tidak punya #explore-grid)
        const gridArtist = document.getElementById('artwork-grid');
        if (gridArtist) {
            const totalCards = artistCards.length;
            let visibleCount = 3;
            artistCards.forEach((card, index) => {
                if (index < visibleCount) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
            if (totalCards <= visibleCount) {
                loadBtnArtist.classList.add('hidden');
            } else {
                loadBtnArtist.classList.remove('hidden');
                loadBtnArtist.addEventListener('click', function() {
                    const remaining = totalCards - visibleCount;
                    if (remaining <= 0) {
                        this.classList.add('hidden');
                        return;
                    }
                    const toShow = Math.min(6, remaining);
                    for (let i = visibleCount; i < visibleCount + toShow; i++) {
                        artistCards[i].classList.remove('hidden');
                    }
                    visibleCount += toShow;
                    if (visibleCount >= totalCards) {
                        this.classList.add('hidden');
                    }
                });
            }
        }
    }

    // --- G. STYLE GUIDE MODAL ---
    const styleBtn = document.getElementById('styleGuideBtn');
    const modal = document.getElementById('styleGuideModal');
    const closeBtn = document.getElementById('modalClose');
    if (styleBtn && modal && closeBtn) {
        styleBtn.addEventListener('click', function() {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        });
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('open')) {
                modal.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    }
});