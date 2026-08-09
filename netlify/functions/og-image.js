// netlify/functions/og-image.js

// ===== POLYFILL WEBSOCKET =====
const WebSocket = require('ws');
global.WebSocket = WebSocket;

const { Resvg } = require('@resvg/resvg-js');
const satori = require('satori').default;
const { createClient } = require('@supabase/supabase-js');

// ===== KONFIGURASI =====
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { enable: false },
    auth: { persistSession: false },
});

// ===== FONT LOADER =====
async function loadFont(url) {
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.arrayBuffer();
    } catch (e) {
        console.warn(`⚠️ Font load failed: ${e.message}`);
        return null;
    }
}

async function getFonts() {
    const fonts = [];

    // 1️⃣ Coba load dari folder lokal (jika ada di Netlify)
    try {
        const fs = require('fs');
        const path = require('path');
        const regularPath = path.join(__dirname, 'fonts/Inter-Regular.ttf');
        const regularData = fs.readFileSync(regularPath);
        if (regularData) {
            fonts.push({ name: 'Inter', data: regularData, weight: 400, style: 'normal' });
            try {
                const boldPath = path.join(__dirname, 'fonts/Inter-Bold.ttf');
                const boldData = fs.readFileSync(boldPath);
                fonts.push({ name: 'Inter', data: boldData, weight: 700, style: 'normal' });
            } catch (_) {
                fonts.push({ name: 'Inter', data: regularData, weight: 700, style: 'normal' });
            }
            console.log('✅ Local font loaded');
            return fonts;
        }
    } catch (_) {}

    // 2️⃣ Download Roboto TTF dari Google Fonts (stabil)
    const regularUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf';
    const boldUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf';

    const regularData = await loadFont(regularUrl);
    if (regularData) {
        fonts.push({ name: 'Roboto', data: regularData, weight: 400, style: 'normal' });
        const boldData = await loadFont(boldUrl);
        if (boldData) {
            fonts.push({ name: 'Roboto', data: boldData, weight: 700, style: 'normal' });
        } else {
            fonts.push({ name: 'Roboto', data: regularData, weight: 700, style: 'normal' });
        }
        console.log('✅ Font loaded (Roboto TTF)');
        return fonts;
    }

    console.error('❌ No fonts loaded.');
    return fonts;
}

// ============================================================
// TEMPLATE FUNCTIONS
// ============================================================

function createArtworkTemplate(data) {
    return {
        type: 'div',
        props: {
            style: {
                display: 'flex',
                flexDirection: 'column',
                width: 1200,
                height: 630,
                backgroundColor: '#141414',
                padding: '48px 56px',
                fontFamily: 'sans-serif',
                overflow: 'hidden',
            },
            children: [
                {
                    type: 'div',
                    props: {
                        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
                        children: [
                            { type: 'span', props: { style: { fontSize: 36, color: '#F4F4F2', fontWeight: 700 }, children: '✦ OriginGFX' } },
                            { type: 'span', props: { style: { fontSize: 18, color: '#6B6B6B' }, children: data.year || '2026' } },
                        ],
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: {
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 16,
                            borderRadius: 12,
                            overflow: 'hidden',
                            backgroundColor: '#1C1C1C',
                            minHeight: 280,
                        },
                        children: data.image ? [
                            {
                                type: 'img',
                                props: {
                                    src: data.image,
                                    style: { width: '100%', height: '100%', objectFit: 'cover' },
                                },
                            },
                        ] : [
                            { type: 'span', props: { style: { color: '#6B6B6B', fontSize: 24 }, children: '✦' } },
                        ],
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            borderTop: '1px solid #303030',
                            paddingTop: 16,
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
                                    children: [
                                        { type: 'span', props: { style: { fontSize: 20, fontWeight: 600, color: '#F4F4F2' }, children: data.title || 'Untitled' } },
                                        { type: 'span', props: { style: { fontSize: 16, color: '#6B6B6B' }, children: '·' } },
                                        { type: 'span', props: { style: { fontSize: 16, color: '#A3A3A3' }, children: data.artist || 'Unknown Artist' } },
                                        data.category ? { type: 'span', props: { style: { fontSize: 14, color: '#6B6B6B', backgroundColor: '#242424', padding: '2px 12px', borderRadius: 20 }, children: data.category } } : null,
                                    ].filter(Boolean),
                                },
                            },
                            {
                                type: 'div',
                                props: {
                                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
                                    children: [
                                        { type: 'span', props: { style: { fontSize: 14, color: '#6B6B6B', fontStyle: 'italic', opacity: 0.7 }, children: 'Gallery First. Store Second. Artist Always.' } },
                                        { type: 'span', props: { style: { fontSize: 12, color: '#6B6B6B', opacity: 0.5 }, children: '✦' } },
                                    ],
                                },
                            },
                        ],
                    },
                },
            ],
        },
    };
}

function createArtistTemplate(data) {
    const badgeLabels = {
        founder: '✦ Founder of OriginGFX',
        contributor: '✦ Contributor to OriginGFX',
        curator: '✦ Curator at OriginGFX',
        verified: '✓ Verified',
        new: '✦ New',
        featured: '✦ Featured',
    };
    const badgeText = badgeLabels[data.badge] || 'Artist';

    return {
        type: 'div',
        props: {
            style: {
                display: 'flex',
                flexDirection: 'column',
                width: 1200,
                height: 630,
                backgroundColor: '#141414',
                padding: '48px 56px',
                fontFamily: 'sans-serif',
                overflow: 'hidden',
            },
            children: [
                {
                    type: 'div',
                    props: {
                        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
                        children: [
                            { type: 'span', props: { style: { fontSize: 28, color: '#F4F4F2', fontWeight: 700 }, children: '✦ OriginGFX' } },
                            { type: 'span', props: { style: { fontSize: 18, color: '#6B6B6B' }, children: data.joined || '2026' } },
                        ],
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12 },
                        children: [
                            data.avatar ? {
                                type: 'img',
                                props: {
                                    src: data.avatar,
                                    style: { width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #303030' },
                                },
                            } : {
                                type: 'div',
                                props: { style: { width: 120, height: 120, borderRadius: '50%', backgroundColor: '#242424', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 40, color: '#6B6B6B' }, children: '✦' },
                            },
                            { type: 'span', props: { style: { fontSize: 38, fontWeight: 700, color: '#F4F4F2', textAlign: 'center' }, children: data.name || 'Unknown Artist' } },
                            { type: 'span', props: { style: { fontSize: 18, color: '#A3A3A3', textAlign: 'center', opacity: 0.8 }, children: badgeText } },
                            data.role ? { type: 'span', props: { style: { fontSize: 16, color: '#6B6B6B', textAlign: 'center' }, children: data.role } } : null,
                            {
                                type: 'div',
                                props: {
                                    style: { display: 'flex', gap: 24, marginTop: 8, fontSize: 16, color: '#6B6B6B' },
                                    children: [
                                        { type: 'span', props: { style: { fontWeight: 500, color: '#F4F4F2' }, children: data.artworks || 0 } },
                                        { type: 'span', props: { children: 'Artworks' } },
                                    ],
                                },
                            },
                        ].filter(Boolean),
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: { borderTop: '1px solid #303030', paddingTop: 12, display: 'flex', justifyContent: 'space-between' },
                        children: [
                            { type: 'span', props: { style: { fontSize: 14, color: '#6B6B6B', fontStyle: 'italic', opacity: 0.7 }, children: 'Gallery First. Store Second. Artist Always.' } },
                            { type: 'span', props: { style: { fontSize: 12, color: '#6B6B6B', opacity: 0.5 }, children: '✦' } },
                        ],
                    },
                },
            ],
        },
    };
}

function createHomeTemplate() {
    return {
        type: 'div',
        props: {
            style: {
                display: 'flex',
                flexDirection: 'column',
                width: 1200,
                height: 630,
                backgroundColor: '#141414',
                padding: '48px 56px',
                fontFamily: 'sans-serif',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                position: 'relative',
            },
            children: [
                {
                    type: 'div',
                    props: {
                        style: {
                            position: 'absolute',
                            inset: 0,
                            opacity: 0.04,
                            backgroundImage: 'radial-gradient(circle at 30% 50%, #F4F4F2 0%, transparent 60%), radial-gradient(circle at 70% 50%, #F4F4F2 0%, transparent 60%)',
                        },
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 10, textAlign: 'center' },
                        children: [
                            { type: 'span', props: { style: { fontSize: 72, color: '#F4F4F2', fontWeight: 700 }, children: '✦ OriginGFX' } },
                            { type: 'span', props: { style: { fontSize: 28, color: '#A3A3A3' }, children: 'Digital Gallery for Minecraft Artists' } },
                            { type: 'span', props: { style: { fontSize: 18, color: '#6B6B6B', letterSpacing: '0.02em', lineHeight: 1.6 }, children: 'Gallery First. · Store Second. · Artist Always.' } },
                            { type: 'div', props: { style: { width: 80, height: 2, backgroundColor: '#303030', marginTop: 20 } } },
                            { type: 'span', props: { style: { fontSize: 14, color: '#6B6B6B', opacity: 0.5, marginTop: 8 }, children: '✦ Curated by OriginGFX' } },
                        ],
                    },
                },
            ],
        },
    };
}

// ===== RENDER =====
async function renderOGImage(template, fonts) {
    const svg = await satori(template, { width: 1200, height: 630, fonts });
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const pngData = resvg.render();
    return pngData.asPng();
}

// ===== HANDLER =====
exports.handler = async function(event, context) {
    try {
        const params = new URLSearchParams(event.queryStringParameters || {});
        const type = params.get('type') || 'home';
        const id = params.get('id');
        const slug = params.get('slug');

        const fonts = await getFonts();
        let template;

        if (type === 'artwork' && id) {
            const { data, error } = await supabase
                .from('artworks')
                .select('*, artists:artist_id(name)')
                .eq('id', id)
                .single();

            if (error || !data) {
                return { statusCode: 404, body: 'Artwork not found' };
            }

            template = createArtworkTemplate({
                title: data.title || 'Untitled',
                artist: data.artists?.name || data.artist || 'Unknown Artist',
                category: data.category || '',
                image: data.image || '',
                year: data.year || '2026',
            });
        } else if (type === 'artist' && slug) {
            const { data, error } = await supabase
                .from('artists')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error || !data) {
                return { statusCode: 404, body: 'Artist not found' };
            }

            const { count } = await supabase
                .from('artworks')
                .select('id', { count: 'exact', head: true })
                .eq('artist_id', data.id);

            template = createArtistTemplate({
                name: data.name || 'Unknown Artist',
                role: data.role || '',
                badge: data.badge || '',
                avatar: data.avatar || '',
                artworks: count || 0,
                joined: data.joined || '2026',
            });
        } else {
            template = createHomeTemplate();
        }

        const pngBuffer = await renderOGImage(template, fonts);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=86400',
            },
            body: pngBuffer.toString('base64'),
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('❌ Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate OG image', details: error.message }),
        };
    }
};