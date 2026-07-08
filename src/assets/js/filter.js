// ============================================================
// FILTER ARTWORK — DENGAN ANIMASI FADE & SLIDE (FIX)
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.grid-4 .card');

    // Fungsi untuk mereset semua kartu ke kondisi tersembunyi
    function resetAllCards() {
        cards.forEach(card => {
            card.classList.remove('visible', 'hiding');
            card.style.opacity = '0';
            card.style.transform = 'translateY(12px)';
        });
    }

    // Fungsi untuk menampilkan kartu yang sesuai
    function showMatchingCards(category) {
        cards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            const shouldShow = (category === 'All' || cardCategory === category);

            if (shouldShow) {
                card.style.display = 'block';
                // Trigger reflow agar transisi berjalan
                void card.offsetHeight;
                card.classList.remove('hiding');
                card.classList.add('visible');
            } else {
                card.classList.remove('visible', 'hiding');
                card.style.display = 'none';
            }
        });
    }

    // Inisialisasi: tampilkan semua kartu saat load
    function initCards() {
        cards.forEach(card => {
            card.style.display = 'block';
            card.style.opacity = '0';
            card.style.transform = 'translateY(12px)';
            // Trigger reflow
            void card.offsetHeight;
            card.classList.add('visible');
        });
    }
    initCards();

    // Event listener untuk filter
    filterButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const category = this.textContent.trim();

            // 1. Sembunyikan semua kartu dengan animasi
            cards.forEach(card => {
                card.classList.remove('visible');
                card.classList.add('hiding');
            });

            // 2. Tunggu animasi selesai (300ms), lalu tampilkan yang sesuai
            setTimeout(() => {
                showMatchingCards(category);
            }, 300);
        });
    });
});