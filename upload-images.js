// upload-images.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ===== POLYFILL WEBSOCKET UNTUK NODE.JS 18 =====
const WebSocket = require('ws');
global.WebSocket = WebSocket;
// ===============================================

// ===== KONFIGURASI =====
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    realtime: { enable: false }
});

// ===== FOLDER SUMBER =====
const ARTWORKS_DIR = path.join(__dirname, 'src/assets/images/artworks');
const AVATARS_DIR = path.join(__dirname, 'src/assets/images/artists');

// ===== FUNGSI UPLOAD =====
async function uploadToBucket(filePath, bucket, destPath) {
    const fileContent = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(destPath, fileContent, {
            contentType: 'image/webp',
            upsert: true
        });

    if (error) {
        console.error(`❌ Gagal upload ${destPath}:`, error.message);
        return false;
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${destPath}`;
    console.log(`✅ ${publicUrl}`);
    return publicUrl;
}

// ===== SCAN DAN UPLOAD ARTWORKS (REKURSIF) =====
async function uploadArtworks() {
    console.log('\n📁 Uploading artworks (rekursif ke subfolder)...\n');
    const urls = {};

    function scanFolder(folderPath, basePath = '') {
        const items = fs.readdirSync(folderPath);
        for (const item of items) {
            const fullPath = path.join(folderPath, item);
            const stat = fs.statSync(fullPath);
            const relativePath = basePath ? `${basePath}/${item}` : item;

            if (stat.isDirectory()) {
                scanFolder(fullPath, relativePath);
            } else {
                const ext = path.extname(item).toLowerCase();
                if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) continue;

                const slug = path.basename(item, ext);
                urls[slug] = { path: relativePath, filePath: fullPath };
            }
        }
    }

    scanFolder(ARTWORKS_DIR);

    const results = {};
    for (const [slug, info] of Object.entries(urls)) {
        const url = await uploadToBucket(info.filePath, 'artworks', info.path);
        if (url) {
            results[slug] = url;
        }
    }
    return results;
}

// ===== SCAN DAN UPLOAD AVATARS =====
async function uploadAvatars() {
    console.log('\n📁 Uploading avatars...\n');
    const urls = {};
    const files = fs.readdirSync(AVATARS_DIR);

    for (const file of files) {
        const filePath = path.join(AVATARS_DIR, file);
        if (fs.statSync(filePath).isDirectory()) continue;

        const ext = path.extname(file).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) continue;

        const destPath = file;
        const url = await uploadToBucket(filePath, 'avatars', destPath);
        if (url) {
            const slug = path.basename(file, ext);
            urls[slug] = url;
        }
    }
    return urls;
}

// ===== GENERATE SQL UPDATE =====
function generateSQL(artworkUrls, avatarUrls) {
    console.log('\n📝 SQL UPDATE STATEMENTS:\n');

    console.log('-- ===== UPDATE ARTWORKS =====');
    for (const [slug, url] of Object.entries(artworkUrls)) {
        console.log(`UPDATE artworks SET image = '${url}' WHERE slug = '${slug}';`);
    }

    console.log('\n-- ===== UPDATE ARTISTS =====');
    for (const [slug, url] of Object.entries(avatarUrls)) {
        console.log(`UPDATE artists SET avatar = '${url}' WHERE slug = '${slug}';`);
    }
}

// ===== MAIN =====
(async () => {
    console.log('🚀 Starting upload to Supabase Storage...\n');

    const artworkUrls = await uploadArtworks();
    const avatarUrls = await uploadAvatars();

    console.log('\n✅ Upload complete!');
    console.log(`   Artworks: ${Object.keys(artworkUrls).length} files`);
    console.log(`   Avatars: ${Object.keys(avatarUrls).length} files`);

    generateSQL(artworkUrls, avatarUrls);

    console.log('\n📌 Copy the SQL above and run it in Supabase SQL Editor.');
})();