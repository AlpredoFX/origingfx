// netlify/functions/og-image.js
const WebSocket = require('ws');
global.WebSocket = WebSocket;

const { Resvg } = require('@resvg/resvg-js');
const satori = require('satori').default;
const { createClient } = require('@supabase/supabase-js');

// ===== KONFIGURASI =====
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    realtime: { enable: false },
    auth: { persistSession: false },
});

// ============================================================
// CACHE HELPER (Supabase Storage)
// ============================================================
const CACHE_BUCKET = 'og-cache';

async function getCachedImage(key) {
    try {
        const { data, error } = await supabase
            .storage
            .from(CACHE_BUCKET)
            .download(key);
        if (error) {
            if (error.message.includes('The resource was not found')) {
                return null;
            }
            console.warn('⚠️ Cache read error:', error.message);
            return null;
        }
        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e) {
        return null;
    }
}

async function saveCachedImage(key, pngBuffer) {
    try {
        await supabase
            .storage
            .from(CACHE_BUCKET)
            .upload(key, pngBuffer, {
                contentType: 'image/png',
                upsert: true,
                cacheControl: 'public, max-age=31536000',
            });
        console.log(`✅ Cache saved: ${key}`);
    } catch (e) {
        console.warn('⚠️ Cache save failed:', e.message);
    }
}

// ============================================================
// FONT LOADER
// ============================================================
async function loadFont(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.arrayBuffer();
}

async function getFonts() {
    const regularUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf';
    const boldUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf';
    try {
        const regular = await loadFont(regularUrl);
        const bold = await loadFont(boldUrl);
        console.log('✅ Font loaded (Roboto TTF)');
        return [
            { name: 'Roboto', data: regular, weight: 400, style: 'normal' },
            { name: 'Roboto', data: bold, weight: 700, style: 'normal' },
        ];
    } catch (e) {
        console.error('❌ Font load failed:', e.message);
        throw e;
    }
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
                // Header
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
                // Image (backgroundImage)
                {
                    type: 'div',
                    props: {
                        style: {
                            flex: 1,
                            marginBottom: 16,
                            borderRadius: 12,
                            overflow: 'hidden',
                            backgroundColor: '#1C1C1C',
                            minHeight: 280,
                            backgroundImage: data.image ? `url(${data.image})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        },
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
                            // Avatar (backgroundImage)
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        width: 120,
                                        height: 120,
                                        borderRadius: '50%',
                                        border: '3px solid #303030',
                                        backgroundImage: data.avatar ? `url(${data.avatar})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundColor: data.avatar ? 'transparent' : '#242424',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        fontSize: 40,
                                        color: '#6B6B6B',
                                    },
                                    children: data.avatar ? [] : ['✦'],
                                },
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
    try {
        const svg = await satori(template, { width: 1200, height: 630, fonts });
        const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
        return resvg.render().asPng();
    } catch (e) {
        console.error('❌ Satori render error:', e);
        throw e;
    }
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

        // ===== CACHE KEY =====
        const cacheKey = `${type}-${id || slug || 'home'}`;

        // ===== 1. Cek cache di Supabase Storage =====
        const cached = await getCachedImage(cacheKey);
        if (cached) {
            console.log(`✅ Cache hit: ${cacheKey}`);
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
                body: cached.toString('base64'),
                isBase64Encoded: true,
            };
        }

        console.log(`🔄 Cache miss: ${cacheKey}, generating...`);

        const fonts = await getFonts();
        let template;

        // ===== ARTWORK =====
        if (type === 'artwork' && id) {
            console.log(`📡 Fetching artwork with ID: ${id}`);
            const { data: artwork, error } = await supabase
                .from('artworks')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !artwork) {
                console.error('❌ Artwork fetch error:', error);
                template = createHomeTemplate();
            } else {
                console.log(`✅ Artwork found: ${artwork.title || 'Untitled'}`);
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

                let imageUrl = artwork.image || '';
                if (imageUrl) {
                    imageUrl = imageUrl + '?width=800';
                }

                template = createArtworkTemplate({
                    title: artwork.title || 'Untitled',
                    artist: artistName,
                    category: artwork.category || '',
                    image: imageUrl,
                    year: artwork.year || '2026',
                });
            }
        }

        // ===== ARTIST =====
        else if (type === 'artist' && slug) {
            console.log(`📡 Fetching artist with slug: ${slug}`);
            const { data: artist, error } = await supabase
                .from('artists')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error || !artist) {
                console.error('❌ Artist fetch error:', error);
                template = createHomeTemplate();
            } else {
                console.log(`✅ Artist found: ${artist.name}`);
                const { count } = await supabase
                    .from('artworks')
                    .select('id', { count: 'exact', head: true })
                    .eq('artist_id', artist.id);

                let avatarUrl = artist.avatar || '';
                if (avatarUrl) {
                    avatarUrl = avatarUrl + '?width=200';
                }

                template = createArtistTemplate({
                    name: artist.name || 'Unknown Artist',
                    role: artist.role || '',
                    badge: artist.badge || '',
                    avatar: avatarUrl,
                    artworks: count || 0,
                    joined: artist.joined || '2026',
                });
            }
        }

        // ===== HOME =====
        else {
            console.log('🏠 Generating home OG');
            template = createHomeTemplate();
        }

        console.log('🎨 Rendering OG image with Satori...');
        const pngBuffer = await renderOGImage(template, fonts);

        // ===== Simpan ke cache =====
        await saveCachedImage(cacheKey, pngBuffer);

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