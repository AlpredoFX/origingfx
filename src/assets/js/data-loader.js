// assets/js/data-loader.js

// ========================================
// LOAD DATA DARI JSON
// ========================================

let data = {};

async function loadData() {
    try {
        const response = await fetch('../data/data.json');
        data = await response.json();
        renderAll();
    } catch (error) {
        console.error('Gagal load data:', error);
    }
}

// ========================================
// RENDER FUNCTIONS
// ========================================

function renderAll() {
    renderFeatured();
    renderLatestUploads();
    renderArtists();
    renderArtworks();
    renderBlog();
    renderServices();
    renderPricing();
}

function renderFeatured() {
    const el = document.querySelector('.featured-content');
    if (!el || !data.featured) return;

    el.innerHTML = `
        <span class="featured-icon">✦</span>
        <h3>${data.featured.title}</h3>
        <p>by ${data.featured.artist}</p>
        <a href="artwork.html?slug=${data.featured.slug}" class="featured-link">View Artwork →</a>
    `;
}

function renderLatestUploads() {
    const container = document.querySelector('.grid');
    if (!container || !data.latestUploads) return;

    container.innerHTML = data.latestUploads.map(item => `
        <div class="card">
            <div class="thumb" style="background-image: url('${item.image}'); background-size: cover; background-position: center;"></div>
            <h3>${item.title}</h3>
            <p>by ${item.artist}</p>
            <a href="artwork.html?slug=${item.slug}" class="card-link">View Artwork →</a>
        </div>
    `).join('');
}

function renderArtists() {
    const container = document.querySelector('.artists-list');
    if (!container || !data.artists) return;

    container.innerHTML = data.artists.map(artist => `
        <article class="artist-item">
            <div class="artist-meta">
                <h3>${artist.name}</h3>
                <p>${artist.role}</p>
            </div>
            <div class="artist-info">
                <span>${artist.artworks} Artworks</span>
                <a href="artist.html?slug=${artist.slug}">View Portfolio →</a>
            </div>
        </article>
    `).join('');
}

function renderArtworks() {
    const container = document.querySelector('.grid-4');
    if (!container || !data.artworks) return;

    container.innerHTML = data.artworks.map(item => `
        <div class="card">
            <div class="thumb" style="background-image: url('${item.image}'); background-size: cover; background-position: center;"></div>
            <h3>${item.title}</h3>
            <p>by ${item.artist}</p>
            <a href="artwork.html?slug=${item.slug}" class="card-link">View Artwork →</a>
        </div>
    `).join('');
}

function renderBlog() {
    const container = document.querySelector('.blog-grid');
    if (!container || !data.blog) return;

    container.innerHTML = data.blog.map(item => `
        <article class="blog-card">
            <div class="blog-thumb" style="background-image: url('${item.image}'); background-size: cover; background-position: center;"></div>
            <div class="blog-content">
                <span class="blog-date">${item.date}</span>
                <h3>${item.title}</h3>
                <p>${item.excerpt}</p>
                <a href="blog.html?slug=${item.slug}" class="blog-link">Read More →</a>
            </div>
        </article>
    `).join('');
}

function renderServices() {
    const container = document.querySelector('.services-grid');
    if (!container || !data.services) return;

    container.innerHTML = data.services.map(item => `
        <div class="service-card">
            <span class="service-icon">${item.icon}</span>
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <a href="pricing.html" class="service-link">View Pricing →</a>
        </div>
    `).join('');
}

function renderPricing() {
    const container = document.querySelector('.pricing-grid');
    if (!container || !data.pricing) return;

    container.innerHTML = data.pricing.map(item => `
        <div class="pricing-card${item.badge ? ' featured' : ''}">
            ${item.badge ? `<span class="pricing-badge">${item.badge}</span>` : ''}
            <h3>${item.name}</h3>
            <div class="pricing-price">${item.price}</div>
            <ul class="pricing-features">
                ${item.features.map(f => `<li>✓ ${f}</li>`).join('')}
            </ul>
            <a href="#" class="btn">Choose Plan</a>
        </div>
    `).join('');
}

// ========================================
// ARTWORK DETAIL PAGE (artwork.html)
// ========================================

function loadArtworkDetail() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) return;

    const artwork = data.artworks.find(a => a.slug === slug);
    if (!artwork) return;

    document.querySelector('.artwork-info h1').textContent = artwork.title;
    document.querySelector('.artwork-artist a').textContent = `by ${artwork.artist}`;
    document.querySelector('.artwork-artist a').href = `artist.html?slug=${artwork.artistSlug}`;
    document.querySelector('.artwork-placeholder').style.backgroundImage = `url('${artwork.image}')`;
    document.querySelector('.artwork-placeholder').style.backgroundSize = 'cover';
    document.querySelector('.artwork-placeholder').style.backgroundPosition = 'center';
    document.querySelector('.artwork-description p').textContent = artwork.description;
    document.querySelector('.artwork-tag').textContent = artwork.category;

    // Meta
    const meta = document.querySelector('.artwork-meta');
    if (meta) {
        meta.innerHTML = `
            <span>📅 ${artwork.year}</span>
            <span>🖌️ ${artwork.software}</span>
            <span>🏷️ ${artwork.category}</span>
        `;
    }

    // Related Artworks
    const relatedContainer = document.querySelector('.grid-3');
    if (relatedContainer) {
        const related = data.artworks.filter(a => a.slug !== slug).slice(0, 3);
        relatedContainer.innerHTML = related.map(item => `
            <div class="card">
                <div class="thumb" style="background-image: url('${item.image}'); background-size: cover; background-position: center;"></div>
                <h3>${item.title}</h3>
                <p>by ${item.artist}</p>
                <a href="artwork.html?slug=${item.slug}" class="card-link">View Artwork →</a>
            </div>
        `).join('');
    }
}

// ========================================
// ARTIST DETAIL PAGE (artist.html)
// ========================================

function loadArtistDetail() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) return;

    const artist = data.artists.find(a => a.slug === slug);
    if (!artist) return;

    document.querySelector('.profile-info h1').textContent = artist.name;
    document.querySelector('.profile-role').textContent = artist.role;

    const stats = document.querySelector('.profile-stats');
    if (stats) {
        stats.innerHTML = `
            <span>${artist.artworks} Artworks</span>
        `;
    }

    // Social
    const socialContainer = document.querySelector('.profile-social');
    if (socialContainer && artist.social) {
        socialContainer.innerHTML = Object.entries(artist.social).map(([platform, url]) => `
            <a href="${url}" target="_blank">${platform.charAt(0).toUpperCase() + platform.slice(1)}</a>
        `).join('');
    }

    // Artist's Artworks
    const container = document.querySelector('.profile-artworks .grid-3');
    if (container) {
        const artistArtworks = data.artworks.filter(a => a.artistSlug === slug);
        container.innerHTML = artistArtworks.map(item => `
            <div class="card">
                <div class="thumb" style="background-image: url('${item.image}'); background-size: cover; background-position: center;"></div>
                <h3>${item.title}</h3>
                <p>${item.year}</p>
                <a href="artwork.html?slug=${item.slug}" class="card-link">View Artwork →</a>
            </div>
        `).join('');
    }
}

// ========================================
// INITIALIZE
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Cek halaman
    const path = window.location.pathname;
    if (path.includes('artwork.html')) {
        setTimeout(loadArtworkDetail, 300);
    }
    if (path.includes('artist.html')) {
        setTimeout(loadArtistDetail, 300);
    }
});

// assets/js/data-loader.js

async function loadData() {
    try {
        // Tambahkan timestamp agar browser tidak cache
        const timestamp = new Date().getTime();
        const response = await fetch(`../data/data.json?t=${timestamp}`);
        data = await response.json();
        renderAll();
    } catch (error) {
        console.error('Gagal load data:', error);
    }
}