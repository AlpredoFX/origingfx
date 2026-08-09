// test-og.js
// ===== POLYFILL WEBSOCKET =====
const WebSocket = require('ws');
global.WebSocket = WebSocket;

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const satori = require('satori').default;
const { createClient } = require('@supabase/supabase-js');

// ===== KONFIGURASI =====
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { enable: false },
    auth: { persistSession: false },
});

console.log('✅ Supabase client initialized');

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

    // 1️⃣ Coba load dari folder lokal (jika ada)
    try {
        const regularPath = path.join(__dirname, 'fonts/Inter-Regular.ttf');
        const regularData = fs.readFileSync(regularPath);
        if (regularData) {
            fonts.push({ name: 'Inter', data: regularData, weight: 400, style: 'normal' });
            // Coba bold
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
    } catch (_) {
        // ignore
    }

    // 2️⃣ Download Roboto TTF dari Google Fonts
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

    console.error('❌ No fonts loaded. Satori needs at least one font.');
    process.exit(1);
}

// ===== TEMPLATE =====
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

// ===== RENDER =====
async function renderOGImage(template, fonts) {
    const svg = await satori(template, { width: 1200, height: 630, fonts });
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const pngData = resvg.render();
    return pngData.asPng();
}

// ===== MAIN =====
async function main() {
    try {
        const fonts = await getFonts();
        const template = createHomeTemplate();
        const pngBuffer = await renderOGImage(template, fonts);
        fs.writeFileSync('og-test.png', pngBuffer);
        console.log('✅ OG test image saved as og-test.png');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();