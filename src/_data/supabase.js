// ============================================================
// ORIGINGFX — SUPABASE DATA FETCHER
// ============================================================
// File ini dijalankan saat build Eleventy untuk mengambil data
// dari Supabase dan mengolahnya sebelum dikirim ke template.
// ============================================================

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// ============================================================
// 1. MAIN FUNCTION
// ============================================================

module.exports = async function() {

    // ============================================================
    // 1.1 KONFIGURASI
    // ============================================================

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    // ============================================================
    // 1.2 FALLBACK — LOCAL DATA.JSON
    // ============================================================
    // Jika Supabase tidak bisa diakses, gunakan data.json lokal
    // ============================================================

    function getLocalData() {
        try {
            const dataPath = path.join(__dirname, 'data.json');
            const rawData = fs.readFileSync(dataPath, 'utf8');
            const data = JSON.parse(rawData);
            console.log('📁 Using local data.json as fallback');
            return { artists: data.artists || [], artworks: data.artworks || [] };
        } catch (err) {
            console.error('❌ Failed to read local data.json:', err.message);
            return { artists: [], artworks: [] };
        }
    }

    // Jika credential tidak ada, langsung fallback
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.warn('⚠️ Supabase credentials missing, using local data.json');
        return getLocalData();
    }

    // ============================================================
    // 1.3 FETCH DATA DARI SUPABASE
    // ============================================================

    async function fetchData(table) {
        const url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
        console.log(`📡 Fetching ${table} from Supabase...`);

        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HTTP ${response.status} for ${table}:`, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`   ✅ ${table}: ${data.length} records`);
        return data;
    }

    // ============================================================
    // 2. FETCH & MAPPING
    // ============================================================

    try {
        // Ambil data dari Supabase secara paralel
        const [artists, artworks] = await Promise.all([
            fetchData('artists'),
            fetchData('artworks')
        ]);

        console.log(`✅ Supabase: ${artists.length} artists, ${artworks.length} artworks loaded`);

        if (artworks.length === 0) {
            console.warn('⚠️ WARNING: 0 artworks fetched from Supabase. Check your database.');
        }

        // ============================================================
        // 2.1 MAP artist_id → name
        // ============================================================

        const artistMap = {};
        artists.forEach(artist => {
            artistMap[artist.id] = artist.name;
        });

        // ============================================================
        // 2.2 TAMBAHKAN FIELD 'artist' KE SETIAP ARTWORK
        // ============================================================

        const artworksWithArtist = artworks.map(artwork => ({
            ...artwork,
            artist: artistMap[artwork.artist_id] || 'Unknown'
        }));

        // ============================================================
        // 3. OLAHAN DATA — LATEST, TRENDING, FEATURED
        // ============================================================

        // 3.1 LATEST — 6 artwork terbaru berdasarkan created_at
        const latestArtworks = [...artworksWithArtist]
            .filter(item => item.created_at || item.updated_at || item.id)
            .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))
            .slice(0, 6);

        // 3.2 TRENDING — 6 artwork dengan views tertinggi
        const trendingArtworks = [...artworksWithArtist]
            .filter(item => item.views || item.updated_at)
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 6);

        // 3.3 FEATURED ARTWORKS — yang memiliki flag featured = true
        const featuredArtworks = artworksWithArtist.filter(item =>
            item.featured === true || item.is_featured === true
        );

        // 3.4 FEATURED ARTISTS — dari tabel artists
        const featuredArtists = artists.filter(item =>
            item.featured === true || item.is_featured === true
        );

        // 3.5 FALLBACK — jika featured kosong, ambil 3 artwork pertama
        const finalFeaturedArtworks = featuredArtworks.length > 0
            ? featuredArtworks
            : artworksWithArtist.slice(0, 3);

        // 3.6 FALLBACK — jika latest kosong, ambil 6 artwork pertama
        const finalLatestArtworks = latestArtworks.length > 0
            ? latestArtworks
            : artworksWithArtist.slice(0, 6);

        // ============================================================
        // 3.7 CATEGORIES & ARTIST NAMES — untuk filter Explore
        // ============================================================

        const categories = [...new Set(artworksWithArtist.map(item => item.category).filter(Boolean))];
        const artistNames = [...new Set(artworksWithArtist.map(item => item.artist).filter(Boolean))];

        // ============================================================
        // 3.8 TYPE LIST — untuk filter type di Explore
        // ============================================================

        const typeList = [...new Set(artworksWithArtist.map(item => item.type || 'artwork').filter(Boolean))];

        // ============================================================
        // 3.9 TYPE STATS — untuk statistik per type di Artist Profile
        // ============================================================

        const artistTypeStats = {};
        artworksWithArtist.forEach(item => {
            const artistId = item.artist_id;
            if (!artistId) return;
            const type = item.type || 'artwork';
            if (!artistTypeStats[artistId]) artistTypeStats[artistId] = {};
            if (!artistTypeStats[artistId][type]) artistTypeStats[artistId][type] = 0;
            artistTypeStats[artistId][type]++;
        });

        // Ubah object menjadi array agar mudah di-loop di Liquid
        const artistTypeStatsArray = {};
        Object.keys(artistTypeStats).forEach(artistId => {
            const stats = artistTypeStats[artistId];
            artistTypeStatsArray[artistId] = Object.keys(stats).map(type => ({
                type: type,
                count: stats[type]
            }));
        });

        // ============================================================
        // 3.10 DOMINANT TYPE & DYNAMIC ROLE — untuk Artist Profile
        // ============================================================

        // Mapping type → role prefix
        const typeRoleMap = {
            'artwork': 'Minecraft Artist',
            'animation': 'Minecraft Animator',
            'skin': 'Skin Artist',
            'model': '3D Modeler',
            'map': 'Map Creator',
            'render': 'Minecraft Render Artist',
            'manip': 'Minecraft Manip Artist',
            'scene': 'Minecraft Scene Artist'
        };

        const artistDominantType = {};
        const artistDynamicRole = {};

        Object.keys(artistTypeStats).forEach(artistId => {
            const stats = artistTypeStats[artistId];
            let maxCount = 0;
            let dominantType = 'artwork';
            Object.keys(stats).forEach(type => {
                if (stats[type] > maxCount) {
                    maxCount = stats[type];
                    dominantType = type;
                }
            });
            artistDominantType[artistId] = dominantType;

            // Cari artist untuk fallback role
            const artist = artists.find(a => a.id === artistId);
            const baseRole = artist?.role || 'Minecraft Artist';

            // Jika dominant type ada di mapping, gunakan, else fallback ke baseRole
            artistDynamicRole[artistId] = typeRoleMap[dominantType] || baseRole;
        });

        // ============================================================
        // 4. LOG & RETURN
        // ============================================================

        console.log(`📊 Olahan: ${finalLatestArtworks.length} latest, ${trendingArtworks.length} trending, ${finalFeaturedArtworks.length} featured`);

        return {
            // Data mentah
            artists,
            artworks: artworksWithArtist,

            // Data olahan untuk homepage
            latestArtworks: finalLatestArtworks,
            trendingArtworks,
            featuredArtworks: finalFeaturedArtworks,
            featuredArtists,

            // Data untuk filter Explore
            categories,
            artistNames,
            typeList,

            // Data untuk statistik Artist Profile
            artistTypeStats: artistTypeStatsArray,

            artistDominantType,
            artistDynamicRole
        };

    // ============================================================
    // 5. ERROR HANDLING — FALLBACK KE LOCAL DATA
    // ============================================================

    } catch (error) {
        console.error('❌ Supabase fetch failed:', error.message);
        console.log('📁 Falling back to local data.json');
        return getLocalData();
    }
};