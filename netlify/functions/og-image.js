// netlify/functions/og-image.js

// Polyfill WebSocket
const WebSocket = require('ws');
global.WebSocket = WebSocket;

const { Resvg } = require('@resvg/resvg-js');
const satori = require('satori');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { enable: false },
    auth: { persistSession: false },
});

// Helper untuk fetch font dengan fallback
async function fetchFont(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch font: ${resp.status}`);
    return resp.arrayBuffer();
}

// ===== TEMPLATE FUNCTIONS =====
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
                // Header
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
                                type: 'span',
                                props: {
                                    style: { fontSize: 36, color: '#F4F4F2', fontWeight: 700, letterSpacing: '-0.02em' },
                                    children: '✦ OriginGFX',
                                },
                            },
                            {
                                type: 'span',
                                props: {
                                    style: { fontSize: 18, color: '#6B6B6B' },
                                    children: data.year || '2026',
                                },
                            },
                        ],
                    },
                },
                // Image
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
                            }
                        ] : [
                            {
                                type: 'div',
                                props: {
                                    style: { color: '#6B6B6B', fontSize: 24 },
                                    children: '✦ No image',
                                },
                            }
                        ],
                    },
                },
                // Footer
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
                                        { type: 'span', props: { style: { fontSize: 16, color: '#A3A3A3' }, children: data.artist || 'Unknown' } },
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
                fontFamily: '"Inter", sans-serif',
                position: 'relative',
                overflow: 'hidden',
            },
            children: [
                {
                    type: 'div',
                    props: {
                        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, zIndex: 10 },
                        children: [
                            { type: 'span', props: { style: { fontSize: 28, color: '#F4F4F2', fontWeight: 700, letterSpacing: '-0.02em' }, children: '✦ OriginGFX' } },
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
                            zIndex: 5,
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
                                props: {
                                    style: { width: 120, height: 120, borderRadius: '50%', backgroundColor: '#242424', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 40, color: '#6B6B6B' },
                                    children: '✦',
                                },
                            },
                            { type: 'span', props: { style: { fontSize: 38, fontWeight: 700, color: '#F4F4F2', letterSpacing: '-0.02em', textAlign: 'center' }, children: data.name || 'Unknown' } },
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
                        style: { borderTop: '1px solid #303030', paddingTop: 12, display: 'flex', justifyContent: 'space-between', zIndex: 10 },
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
                fontFamily: '"Inter", sans-serif',
                position: 'relative',
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'center',
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
                            { type: 'span', props: { style: { fontSize: 72, color: '#F4F4F2', fontWeight: 700, letterSpacing: '-0.03em' }, children: '✦ OriginGFX' } },
                            { type: 'span', props: { style: { fontSize: 28, color: '#A3A3A3', fontWeight: 400, letterSpacing: '0.04em' }, children: 'Digital Gallery for Minecraft Artists' } },
                            { type: 'div', props: { style: { marginTop: 12, fontSize: 18, color: '#6B6B6B', letterSpacing: '0.02em', lineHeight: 1.6 }, children: 'Gallery First. · Store Second. · Artist Always.' } },
                            { type: 'div', props: { style: { marginTop: 20, width: 80, height: 2, backgroundColor: '#303030' } } },
                            { type: 'span', props: { style: { fontSize: 14, color: '#6B6B6B', opacity: 0.5, marginTop: 8 }, children: '✦ Curated by OriginGFX' } },
                        ],
                    },
                },
            ],
        },
    };
}

// ===== RENDER =====
async function renderOGImage(template) {
    const [regular, bold, italic] = await Promise.all([
        fetchFont('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'),
        fetchFont('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuBWYAZ9hiA.woff2'),
        fetchFont('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuOKYAZ9hiA.woff2'),
    ]);

    const svg = await satori(template, {
        width: 1200,
        height: 630,
        fonts: [
            { name: 'Inter', data: regular, weight: 400, style: 'normal' },
            { name: 'Inter', data: bold, weight: 700, style: 'normal' },
            { name: 'Inter', data: italic, weight: 400, style: 'italic' },
        ],
    });

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const pngData = resvg.render();
    return pngData.asPng();
}

// ===== HANDLER =====
exports.handler = async function(event) {
    try {
        const params = new URLSearchParams(event.queryStringParameters || {});
        const type = params.get('type') || 'home';
        const id = params.get('id');
        const slug = params.get('slug');

        let template;

        if (type === 'artwork' && id) {
            const { data, error } = await supabase
                .from('artworks')
                .select('*, artists:artist_id(name)')
                .eq('id', id)
                .single();
            if (error || !data) throw new Error('Artwork not found');
            template = createArtworkTemplate({
                title: data.title || 'Untitled',
                artist: data.artists?.name || data.artist || 'Unknown',
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
            if (error || !data) throw new Error('Artist not found');
            const { count } = await supabase
                .from('artworks')
                .select('id', { count: 'exact', head: true })
                .eq('artist_id', data.id);
            template = createArtistTemplate({
                name: data.name || 'Unknown',
                role: data.role || '',
                badge: data.badge || '',
                avatar: data.avatar || '',
                artworks: count || 0,
                joined: data.joined || '2026',
            });
        } else {
            template = createHomeTemplate();
        }

        const pngBuffer = await renderOGImage(template);

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
        console.error('OG error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'OG generation failed', details: error.message }),
        };
    }
};