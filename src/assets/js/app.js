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
// ACTIVE NAV LINK
// ========================================

const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
        link.classList.add('active');
    }
});