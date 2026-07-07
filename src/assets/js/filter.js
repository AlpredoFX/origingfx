// ============================================================
// FILTER ARTWORK (Event Delegation — Aman)
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    const filterBar = document.querySelector('.filter-bar');
    const cards = document.querySelectorAll('.grid-4 .card');

    if (filterBar) {
        filterBar.addEventListener('click', function(e) {
            const button = e.target.closest('.filter-btn');
            if (!button) return;

            // Update active button
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const category = button.textContent.trim();

            cards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (category === 'All' || cardCategory === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});