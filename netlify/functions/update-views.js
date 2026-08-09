// netlify/functions/update-views.js
// ===== POLYFILL WEBSOCKET =====
const WebSocket = require('ws');
global.WebSocket = WebSocket;

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables');
}

// ===== Supabase client dengan Realtime disabled =====
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY, {
    realtime: { enable: false },
    auth: { persistSession: false },
});

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

        console.log(`📡 Updating view for artwork: ${slug}`);

        // Ambil data artwork saat ini
        const { data: artwork, error: fetchError } = await supabase
            .from('artworks')
            .select('views')
            .eq('slug', slug)
            .single();

        if (fetchError || !artwork) {
            console.error('❌ Artwork not found:', fetchError);
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Artwork not found' }),
            };
        }

        const currentViews = artwork.views || 0;
        const newViews = currentViews + 1;

        const { error: updateError } = await supabase
            .from('artworks')
            .update({ views: newViews })
            .eq('slug', slug);

        if (updateError) {
            console.error('❌ Update failed:', updateError);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to update views' }),
            };
        }

        console.log(`✅ Views updated: ${newViews}`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
            },
            body: JSON.stringify({ success: true, views: newViews }),
        };
    } catch (error) {
        console.error('❌ Fatal error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};