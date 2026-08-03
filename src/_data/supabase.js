// src/_data/supabase.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');  // polyfill untuk Node.js

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
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return response.json();
    }

    try {
        const [artists, artworks] = await Promise.all([
            fetchData('artists'),
            fetchData('artworks')
        ]);

        console.log(`✅ Supabase: ${artists.length} artists, ${artworks.length} artworks loaded`);

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

        // ========== OLAHAN DATA DENGAN FALLBACK ==========

        // 1. Latest Artworks (urutkan berdasarkan created_at, fallback ke updated_at/id)
        const latestArtworks = [...artworksWithArtist]
            .filter(item => item.created_at || item.updated_at || item.id)
            .sort((a, b) => {
                const dateA = new Date(a.created_at || a.updated_at || 0);
                const dateB = new Date(b.created_at || b.updated_at || 0);
                return dateB - dateA;
            })
            .slice(0, 6);

        // 2. Trending (prioritas views, fallback updated_at)
        const trendingArtworks = [...artworksWithArtist]
            .filter(item => item.updated_at || item.views)
            .sort((a, b) => {
                if (a.views !== undefined && b.views !== undefined) {
                    return (b.views || 0) - (a.views || 0);
                }
                const dateA = new Date(a.updated_at || 0);
                const dateB = new Date(b.updated_at || 0);
                return dateB - dateA;
            })
            .slice(0, 6);

        // 3. Featured Artworks (cek field 'featured' atau 'is_featured')
        const featuredArtworks = artworksWithArtist.filter(item => 
            item.featured === true || item.is_featured === true
        );

        // 4. Featured Artists
        const featuredArtists = artists.filter(item => 
            item.featured === true || item.is_featured === true
        );

        // 5. Jika featuredArtworks kosong, ambil 3 artwork pertama sebagai fallback
        const finalFeaturedArtworks = featuredArtworks.length > 0 
            ? featuredArtworks 
            : artworksWithArtist.slice(0, 3);

        // 6. Pastikan latestArtworks tidak kosong (fallback ke semua artwork)
        const finalLatestArtworks = latestArtworks.length > 0 
            ? latestArtworks 
            : artworksWithArtist.slice(0, 6);

        // 7. Categories & Artist Names untuk filter (dari artworksWithArtist)
        const categories = [...new Set(artworksWithArtist.map(item => item.category).filter(Boolean))];
        const artistNames = [...new Set(artworksWithArtist.map(item => item.artist).filter(Boolean))];

        console.log(`📊 Olahan: ${finalLatestArtworks.length} latest, ${trendingArtworks.length} trending, ${finalFeaturedArtworks.length} featured artworks, ${featuredArtists.length} featured artists`);

        // ====== KEMBALIKAN DATA LENGKAP ======
        return {
            artists,
            artworks: artworksWithArtist,      // semua artwork dengan field 'artist'
            latestArtworks: finalLatestArtworks,
            trendingArtworks,
            featuredArtworks: finalFeaturedArtworks,
            featuredArtists,
            categories,
            artistNames
        };

    } catch (error) {
        console.error('❌ Supabase fetch failed:', error.message);
        console.log('📁 Falling back to local data.json');
        return getLocalData();
    }
};