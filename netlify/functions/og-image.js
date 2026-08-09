// netlify/functions/og-image.js
const { Resvg } = require('@resvg/resvg-js');
const satori = require('satori');
const { createClient } = require('@supabase/supabase-js');

// ===== POLYFILL WEBSOCKET UNTUK NODE.js < 22 =====
if (typeof WebSocket === 'undefined') {
    try {
        const WebSocket = require('ws');
        global.WebSocket = WebSocket;
    } catch (e) {
        console.warn('⚠️ WebSocket polyfill not available, Realtime will be disabled');
    }
}

// ===== KONFIGURASI =====
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables');
}

// ===== Supabase Client dengan Realtime DISABLED =====
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { enable: false },
    auth: { persistSession: false },
});
// ===== FONT =====
// Kita akan pakai font system atau Google Fonts
// Untuk production, download font dan load dari file
// Untuk sekarang, kita pakai font yang tersedia di sistem atau default

// ===== TEMPLATE OG =====
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
                fontFamily: '"Inter", sans-serif',
                position: 'relative',
                overflow: 'hidden',
            },
            children: [
                // Header: ✦ OriginGFX
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16,
                            zIndex: 10,
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                    },
                                    children: [
                                        {
                                            type: 'span',
                                            props: {
                                                style: {
                                                    fontSize: 36,
                                                    color: '#F4F4F2',
                                                    fontWeight: 700,
                                                    letterSpacing: '-0.02em',
                                                },
                                                children: '✦ OriginGFX',
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                type: 'span',
                                props: {
                                    style: {
                                        fontSize: 18,
                                        color: '#6B6B6B',
                                        fontWeight: 400,
                                    },
                                    children: data.year || '2026',
                                },
                            },
                        ],
                    },
                },
                // Body: Artwork Image
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
                            position: 'relative',
                            zIndex: 5,
                            minHeight: 280,
                        },
                        children: data.image ? [
                            {
                                type: 'img',
                                props: {
                                    src: data.image,
                                    style: {
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    },
                                },
                            },
                        ] : [
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        color: '#6B6B6B',
                                        fontSize: 24,
                                    },
                                    children: '✦ No image',
                                },
                            },
                        ],
                    },
                },
                // Footer: Title, Artist, Category
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            zIndex: 10,
                            borderTop: '1px solid #303030',
                            paddingTop: 16,
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        flexWrap: 'wrap',
                                    },
                                    children: [
                                        {
                                            type: 'span',
                                            props: {
                                                style: {
                                                    fontSize: 20,
                                                    fontWeight: 600,
                                                    color: '#F4F4F2',
                                                    letterSpacing: '-0.02em',
                                                },
                                                children: data.title || 'Untitled',
                                            },
                                        },
                                        {
                                            type: 'span',
                                            props: {
                                                style: {
                                                    fontSize: 16,
                                                    color: '#6B6B6B',
                                                },
                                                children: '·',
                                            },
                                        },
                                        {
                                            type: 'span',
                                            props: {
                                                style: {
                                                    fontSize: 16,
                                                    color: '#A3A3A3',
                                                },
                                                children: data.artist || 'Unknown Artist',
                                            },
                                        },
                                        data.category ? {
                                            type: 'span',
                                            props: {
                                                style: {
                                                    fontSize: 14,
                                                    color: '#6B6B6B',
                                                    backgroundColor: '#242424',
                                                    padding: '2px 12px',
                                                    borderRadius: 20,
                                                },
                                                children: data.category,
                                            },
                                        } : null,
                                    ].filter(Boolean),
                                },
                            },
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: 4,
                                    },
                                    children: [
                                        {
                                            type: 'span',
                                            props: {
                                                style: {
                                                    fontSize: 14,
                                                    color: '#6B6B6B',
                                                    fontStyle: 'italic',
                                                    opacity: 0.7,
                                                },
                                                children: 'Gallery First. Store Second. Artist Always.',
                                            },
                                        },
                                        {
                                            type: 'span',
                                            props: {
                                                style: {
                                                    fontSize: 12,
                                                    color: '#6B6B6B',
                                                    opacity: 0.5,
                                                },
                                                children: '✦',
                                            },
                                        },
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
                fontFamily: '"Inter", sans-serif',
                position: 'relative',
                overflow: 'hidden',
            },
            children: [
                // Header
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 24,
                            zIndex: 10,
                        },
                        children: [
                            {
                                type: 'span',
                                props: {
                                    style: {
                                        fontSize: 28,
                                        color: '#F4F4F2',
                                        fontWeight: 700,
                                        letterSpacing: '-0.02em',
                                    },
                                    children: '✦ OriginGFX',
                                },
                            },
                            {
                                type: 'span',
                                props: {
                                    style: {
                                        fontSize: 18,
                                        color: '#6B6B6B',
                                    },
                                    children: data.joined || '2026',
                                },
                            },
                        ],
                    },
                },
                // Body: Avatar + Info
                {
                    type: 'div',
                    props: {
                        style: {
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 16,
                            zIndex: 5,
                        },
                        children: [
                            // Avatar
                            data.avatar ? {
                                type: 'img',
                                props: {
                                    src: data.avatar,
                                    style: {
                                        width: 120,
                                        height: 120,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '3px solid #303030',
                                    },
                                },
                            } : {
                                type: 'div',
                                props: {
                                    style: {
                                        width: 120,
                                        height: 120,
                                        borderRadius: '50%',
                                        backgroundColor: '#242424',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        fontSize: 40,
                                        color: '#6B6B6B',
                                    },
                                    children: '✦',
                                },
                            },
                            // Name
                            {
                                type: 'span',
                                props: {
                                    style: {
                                        fontSize: 38,
                                        fontWeight: 700,
                                        color: '#F4F4F2',
                                        letterSpacing: '-0.02em',
                                        textAlign: 'center',
                                    },
                                    children: data.name || 'Unknown Artist',
                                },
                            },
                            // Badge / Role
                            {
                                type: 'span',
                                props: {
                                    style: {
                                        fontSize: 18,
                                        color: '#A3A3A3',
                                        textAlign: 'center',
                                        opacity: 0.8,
                                    },
                                    children: badgeText,
                                },
                            },
                            // Role profession
                            data.role ? {
                                type: 'span',
                                props: {
                                    style: {
                                        fontSize: 16,
                                        color: '#6B6B6B',
                                        textAlign: 'center',
                                    },
                                    children: data.role,
                                },
                            } : null,
                            // Stats
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        gap: 24,
                                        marginTop: 8,
                                        fontSize: 16,
                                        color: '#6B6B6B',
                                    },
                                    children: [
                                        {
                                            type: 'span',
                                            props: {
                                                style: { fontWeight: 500, color: '#F4F4F2' },
                                                children: data.artworks || 0,
                                            },
                                        },
                                        {
                                            type: 'span',
                                            props: { children: 'Artworks' },
                                        },
                                    ],
                                },
                            },
                        ].filter(Boolean),
                    },
                },
                // Footer
                {
                    type: 'div',
                    props: {
                        style: {
                            borderTop: '1px solid #303030',
                            paddingTop: 12,
                            display: 'flex',
                            justifyContent: 'space-between',
                            zIndex: 10,
                        },
                        children: [
                            {
                                type: 'span',
                                props: {
                                    style: { fontSize: 14, color: '#6B6B6B', fontStyle: 'italic', opacity: 0.7 },
                                    children: 'Gallery First. Store Second. Artist Always.',
                                },
                            },
                            {
                                type: 'span',
                                props: {
                                    style: { fontSize: 12, color: '#6B6B6B', opacity: 0.5 },
                                    children: '✦',
                                },
                            },
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
                fontFamily: '"Inter", sans-serif',
                position: 'relative',
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'center',
            },
            children: [
                // Large background subtle texture
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
                // Main content
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 16,
                            zIndex: 10,
                            textAlign: 'center',
                        },
                        children: [
                            {
                                type: 'span',
                                props: {
                                    style: {
                                        fontSize: 72,
                                        color: '#F4F4F2',
                                        fontWeight: 700,
                                        letterSpacing: '-0.03em',
                                    },
                                    children: '✦ OriginGFX',
                                },
                            },
                            {
                                type: 'span',
                                props: {
                                    style: {
                                        fontSize: 28,
                                        color: '#A3A3A3',
                                        fontWeight: 400,
                                        letterSpacing: '0.04em',
                                    },
                                    children: 'Digital Gallery for Minecraft Artists',
                                },
                            },
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        marginTop: 12,
                                        fontSize: 18,
                                        color: '#6B6B6B',
                                        letterSpacing: '0.02em',
                                        lineHeight: 1.6,
                                    },
                                    children: 'Gallery First. · Store Second. · Artist Always.',
                                },
                            },
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        marginTop: 20,
                                        width: 80,
                                        height: 2,
                                        backgroundColor: '#303030',
                                    },
                                },
                            },
                            {
                                type: 'span',
                                props: {
                                    style: {
                                        fontSize: 14,
                                        color: '#6B6B6B',
                                        opacity: 0.5,
                                        marginTop: 8,
                                    },
                                    children: '✦ Curated by OriginGFX',
                                },
                            },
                        ],
                    },
                },
            ],
        },
    };
}

// ===== RENDER FUNCTION =====
async function renderOGImage(template) {
    try {
        const svg = await satori.default(template, {
            width: 1200,
            height: 630,
            fonts: [
                {
                    name: 'Inter',
                    data: await fetch('https://cdn.jsdelivr.net/npm/typeface-inter/Inter-Regular.woff').then(r => r.arrayBuffer()),
                    weight: 400,
                    style: 'normal',
                },
                {
                    name: 'Inter',
                    data: await fetch('https://cdn.jsdelivr.net/npm/typeface-inter/Inter-Bold.woff').then(r => r.arrayBuffer()),
                    weight: 700,
                    style: 'normal',
                },
                {
                    name: 'Inter',
                    data: await fetch('https://cdn.jsdelivr.net/npm/typeface-inter/Inter-Italic.woff').then(r => r.arrayBuffer()),
                    weight: 400,
                    style: 'italic',
                },
            ],
        });

        const resvg = new Resvg(svg, {
            fitTo: {
                mode: 'width',
                value: 1200,
            },
        });

        const pngData = resvg.render();
        return pngData.asPng();
    } catch (error) {
        console.error('❌ Render error:', error);
        throw error;
    }
}

// ===== NETLIFY FUNCTION HANDLER =====
exports.handler = async function(event, context) {
    try {
        const params = new URLSearchParams(event.queryStringParameters || {});
        const type = params.get('type') || 'home';
        const id = params.get('id');
        const slug = params.get('slug');

        let template;
        let cacheKey;

        // ===== ARTWORK =====
        if (type === 'artwork' && id) {
            console.log('📡 Fetching artwork:', id);
            const { data, error } = await supabase
                .from('artworks')
                .select('*, artists:artist_id(name)')
                .eq('id', id)
                .single();

            if (error || !data) {
                console.error('❌ Artwork not found:', error);
                return {
                    statusCode: 404,
                    body: 'Artwork not found',
                };
            }

            template = createArtworkTemplate({
                title: data.title || 'Untitled',
                artist: data.artists?.name || data.artist || 'Unknown Artist',
                category: data.category || '',
                image: data.image || '',
                year: data.year || '2026',
            });
            cacheKey = `artwork-${id}`;

        // ===== ARTIST =====
        } else if (type === 'artist' && slug) {
            console.log('📡 Fetching artist:', slug);
            const { data, error } = await supabase
                .from('artists')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error || !data) {
                console.error('❌ Artist not found:', error);
                return {
                    statusCode: 404,
                    body: 'Artist not found',
                };
            }

            // Hitung jumlah artworks
            const { count, error: countError } = await supabase
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
            cacheKey = `artist-${slug}`;

        // ===== HOME (default) =====
        } else {
            console.log('🏠 Generating home OG image');
            template = createHomeTemplate();
            cacheKey = 'home';
        }

        // ===== RENDER =====
        console.log('🎨 Rendering OG image...');
        const pngBuffer = await renderOGImage(template);

        console.log('✅ OG image generated successfully');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=86400', // Cache 24 jam
                'Cache-Key': cacheKey,
            },
            body: pngBuffer.toString('base64'),
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('❌ OG Image generation error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate OG image', details: error.message }),
        };
    }
};