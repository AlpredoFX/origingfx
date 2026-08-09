// netlify/functions/update-views.js
const fetch = require('node-fetch');

exports.handler = async function(event) {
    try {
        const params = new URLSearchParams(event.queryStringParameters || {});
        const slug = params.get('slug');

        if (!slug) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing slug parameter' }),
            };
        }

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.error('❌ Missing Supabase env');
            return { statusCode: 500, body: 'Missing Supabase config' };
        }

        // 1. Ambil views saat ini
        const getRes = await fetch(
            `${SUPABASE_URL}/rest/v1/artworks?slug=eq.${slug}&select=views`,
            {
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                },
            }
        );

        const data = await getRes.json();
        if (!data || data.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Artwork not found' }),
            };
        }

        const currentViews = data[0].views || 0;
        const newViews = currentViews + 1;

        // 2. Update views
        const patchRes = await fetch(
            `${SUPABASE_URL}/rest/v1/artworks?slug=eq.${slug}`,
            {
                method: 'PATCH',
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    Prefer: 'return=minimal',
                },
                body: JSON.stringify({ views: newViews }),
            }
        );

        if (!patchRes.ok) {
            throw new Error(`HTTP ${patchRes.status}`);
        }

        console.log(`✅ Views updated for ${slug}: ${newViews}`);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, views: newViews }),
        };
    } catch (error) {
        console.error('❌ Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};