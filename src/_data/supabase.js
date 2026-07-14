// src/_data/supabase.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');  // ← polyfill untuk Node.js

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
        return { artists, artworks };

    } catch (error) {
        console.error('❌ Supabase fetch failed:', error.message);
        console.log('📁 Falling back to local data.json');
        return getLocalData();
    }
};