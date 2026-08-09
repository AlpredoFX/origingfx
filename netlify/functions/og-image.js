// netlify/functions/og-image.js
const WebSocket = require('ws');
global.WebSocket = WebSocket;

const { Resvg } = require('@resvg/resvg-js');
const satori = require('satori').default;
const { createClient } = require('@supabase/supabase-js');

// ===== KONFIGURASI =====
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Prioritas: Service Key (bypass RLS) > Anon Key
const SUPABASE_KEY = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase environment variables');
}

console.log(`🔧 Supabase URL: ${SUPABASE_URL ? '✅ set' : '❌ missing'}`);
console.log(`🔧 Supabase Key: ${SUPABASE_KEY ? '✅ set' : '❌ missing'}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    realtime: { enable: false },
    auth: { persistSession: false },
});

// ===== FONT =====
async function loadFont(url) {
    const response = await fetch(url);
    return await response.arrayBuffer();
}

async function getFonts() {
    const regularUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf';
    const boldUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf';
    const regular = await loadFont(regularUrl);
    const bold = await loadFont(boldUrl);
    return [
        { name: 'Roboto', data: regular, weight: 400, style: 'normal' },
        { name: 'Roboto', data: bold, weight: 700, style: 'normal' },
    ];
}

// ============================================================
// TEMPLATES
// ============================================================

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
                fontFamily: '"Roboto", sans-serif',
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
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 16,
                            textAlign: 'center',
                        },
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
                fontFamily: '"Roboto", sans-serif',
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
                            { type: 'span', props: { style: { color: '#6B6B6B', fontSize: 24 }, children: '✦ No image' } },
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
                fontFamily: '"Roboto", sans-serif',
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
                        style: {
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 12,
                        },
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

// ============================================================
// RENDER
// ============================================================

async function renderOGImage(template, fonts) {
    const svg = await satori(template, { width: 1200, height: 630, fonts });
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    return resvg.render().asPng();
}

// ============================================================
// HANDLER
// ============================================================

exports.handler = async function(event) {
    try {
        const params = new URLSearchParams(event.queryStringParameters || {});
        const type = params.get('type') || 'home';
        const id = params.get('id');
        const slug = params.get('slug');

        console.log(`📡 Request: type=${type}, id=${id}, slug=${slug}`);

        const fonts = await getFonts();
        let template;

        // ===== ARTWORK =====
        if (type === 'artwork' && id) {
            console.log('📡 Fetching artwork with ID:', id);
            // Query tanpa join (untuk menghindari error relasi)
            const { data: artwork, error } = await supabase
                .from('artworks')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('❌ Artwork fetch error:', error);
                template = createHomeTemplate();
            } else if (artwork) {
                console.log('✅ Artwork found:', artwork.title);
                // Ambil artist name secara terpisah
                let artistName = 'Unknown Artist';
                if (artwork.artist_id) {
                    const { data: artist, error: artistErr } = await supabase
                        .from('artists')
                        .select('name')
                        .eq('id', artwork.artist_id)
                        .single();
                    if (!artistErr && artist) {
                        artistName = artist.name;
                    }
                }
                template = createArtworkTemplate({
                    title: artwork.title || 'Untitled',
                    artist: artistName,
                    category: artwork.category || '',
                    image: artwork.image || '',
                    year: artwork.year || '2026',
                });
            } else {
                console.log('❌ Artwork not found');
                template = createHomeTemplate();
            }

        // ===== ARTIST =====
        } else if (type === 'artist' && slug) {
            console.log('📡 Fetching artist with slug:', slug);
            const { data: artist, error } = await supabase
                .from('artists')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) {
                console.error('❌ Artist fetch error:', error);
                template = createHomeTemplate();
            } else if (artist) {
                console.log('✅ Artist found:', artist.name);
                const { count } = await supabase
                    .from('artworks')
                    .select('id', { count: 'exact', head: true })
                    .eq('artist_id', artist.id);

                template = createArtistTemplate({
                    name: artist.name || 'Unknown Artist',
                    role: artist.role || '',
                    badge: artist.badge || '',
                    avatar: artist.avatar || '',
                    artworks: count || 0,
                    joined: artist.joined || '2026',
                });
            } else {
                console.log('❌ Artist not found');
                template = createHomeTemplate();
            }

        // ===== HOME =====
        } else {
            console.log('🏠 Generating home OG');
            template = createHomeTemplate();
        }

        console.log('🎨 Rendering...');
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
        console.error('❌ Fatal error:', error);
        // Fallback: generate home template
        try {
            const fonts = await getFonts();
            const template = createHomeTemplate();
            const pngBuffer = await renderOGImage(template, fonts);
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'image/png' },
                body: pngBuffer.toString('base64'),
                isBase64Encoded: true,
            };
        } catch (_) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message }),
            };
        }
    }
};