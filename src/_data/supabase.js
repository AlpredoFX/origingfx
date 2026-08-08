// src/_data/supabase.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

module.exports = async function() {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    // Fungsi untuk baca data.json lokal (fallback)
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

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.warn('⚠️ Supabase credentials missing, using local data.json');
        return getLocalData();
    }

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

    try {
        const [artists, artworks] = await Promise.all([
            fetchData('artists'),
            fetchData('artworks')
        ]);

        console.log(`✅ Supabase: ${artists.length} artists, ${artworks.length} artworks loaded`);

        // Jika data dari Supabase kosong, jangan fallback, biarkan saja.
        // Tapi kita tetap beri peringatan.
        if (artworks.length === 0) {
            console.warn('⚠️ WARNING: 0 artworks fetched from Supabase. Check your database.');
        }

        // ====== MAP artist_id → name ======
        const artistMap = {};
        artists.forEach(artist => {
            artistMap[artist.id] = artist.name;
        });

        // ====== Tambahkan field 'artist' ke setiap artwork ======
        const artworksWithArtist = artworks.map(artwork => ({
            ...artwork,
            artist: artistMap[artwork.artist_id] || 'Unknown'
        }));

        // ========== OLAHAN DATA ==========
        const latestArtworks = [...artworksWithArtist]
            .filter(item => item.created_at || item.updated_at || item.id)
            .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))
            .slice(0, 6);

        const trendingArtworks = [...artworksWithArtist]
            .filter(item => item.views || item.updated_at)
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 6);

        const featuredArtworks = artworksWithArtist.filter(item => 
            item.featured === true || item.is_featured === true
        );

        const finalFeaturedArtworks = featuredArtworks.length > 0 ? featuredArtworks : artworksWithArtist.slice(0, 3);
        const finalLatestArtworks = latestArtworks.length > 0 ? latestArtworks : artworksWithArtist.slice(0, 6);

        const categories = [...new Set(artworksWithArtist.map(item => item.category).filter(Boolean))];
        const artistNames = [...new Set(artworksWithArtist.map(item => item.artist).filter(Boolean))];

        console.log(`📊 Olahan: ${finalLatestArtworks.length} latest, ${trendingArtworks.length} trending, ${finalFeaturedArtworks.length} featured`);

        // Kembalikan data dari Supabase (jangan fallback ke local)
        return {
            artists,
            artworks: artworksWithArtist,
            latestArtworks: finalLatestArtworks,
            trendingArtworks,
            featuredArtworks: finalFeaturedArtworks,
            featuredArtists: artists.filter(a => a.featured === true || a.is_featured === true),
            categories,
            artistNames
        };

    } catch (error) {
        console.error('❌ Supabase fetch failed:', error.message);
        console.log('📁 Falling back to local data.json');
        return getLocalData();
    }
};