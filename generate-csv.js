// generate-csv.js
const fs = require('fs');
const path = require('path');

// Baca data.json
const dataPath = path.join(__dirname, 'src/_data/data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

// --- Fungsi helper untuk escape CSV ---
function escapeCsv(str) {
    if (str === null || str === undefined) return '';
    const s = String(str);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

function formatJson(obj) {
    return escapeCsv(JSON.stringify(obj));
}

// --- 1. Generate artists.csv ---
const artistsHeaders = ['slug', 'name', 'role', 'bio', 'avatar', 'badge', 'joined', 'social', 'services'];
const artistsRows = data.artists.map(artist => {
    // Sosial media: tetap sebagai JSON object
    const social = artist.social || {};
    // Services: array
    const services = artist.services || [];
    return [
        artist.slug,
        artist.name,
        artist.role || '',
        artist.bio || '',
        artist.avatar || '',
        artist.badge || '',
        artist.joined || '',
        formatJson(social),
        formatJson(services)
    ].map(escapeCsv).join(',');
});

const artistsCsv = artistsHeaders.join(',') + '\n' + artistsRows.join('\n');
fs.writeFileSync('artists.csv', artistsCsv, 'utf8');
console.log('✅ artists.csv selesai dibuat');

// --- 2. Generate artworks.csv ---
// Kita perlu mapping slug artist ke id (nanti di database akan diisi otomatis, tapi kita pakai slug sebagai referensi sementara)
// Untuk CSV, kita akan isi kolom artist_id dengan slug dulu, nanti di-import, lalu di-update.
// Atau lebih baik kita isi dengan slug agar bisa di-join manual.

const artworksHeaders = ['slug', 'artist_slug', 'title', 'description', 'image', 'category', 'year', 'software', 'featured', 'created_at'];
const artworksRows =supabase.artworks.map(artwork => {
    const software = artwork.software || [];
    return [
        artwork.slug,
        artwork.artistSlug,
        artwork.title,
        artwork.description || '',
        artwork.image || '',
        artwork.category || '',
        artwork.year || '',
        formatJson(software),
        artwork.featured ? 'true' : 'false',
        artwork.created || ''
    ].map(escapeCsv).join(',');
});

const artworksCsv = artworksHeaders.join(',') + '\n' + artworksRows.join('\n');
fs.writeFileSync('artworks.csv', artworksCsv, 'utf8');
console.log('✅ artworks.csv selesai dibuat');