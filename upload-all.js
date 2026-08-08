//run pake ini: node upload-all.js

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
global.WebSocket = WebSocket;

// ===== KONFIGURASI =====
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    realtime: { enable: false }
});

const ARTWORKS_DIR = path.join(__dirname, 'src/assets/images/artworks');
const AVATARS_DIR = path.join(__dirname, 'src/assets/images/artists');

// ===== UTILITY =====
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.webp': 'image/webp',
        '.gif': 'image/gif', '.svg': 'image/svg+xml'
    };
    return map[ext] || 'application/octet-stream';
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function sanitizeFilename(filename) {
    // Hapus karakter yang tidak aman untuk URL / path storage
    return filename.replace(/[{}()]/g, '-').replace(/\s+/g, '-');
}

function getSlugFromFilename(filename) {
    return path.basename(filename, path.extname(filename))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// ===== CEK APAKAH SLUG SUDAH ADA =====
async function getExistingSlugs(table, slugField = 'slug') {
    const { data, error } = await supabase
        .from(table)
        .select(slugField);
    if (error) {
        console.error(`❌ Error fetching ${table}:`, error.message);
        return new Set();
    }
    return new Set(data.map(row => row[slugField]));
}

// ===== UPLOAD KE STORAGE =====
async function uploadToBucket(filePath, bucket, destPath) {
    const sanitized = destPath.split('/').map(part => sanitizeFilename(part)).join('/');
    const fileContent = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(sanitized, fileContent, {
            contentType: getMimeType(filePath),
            upsert: true
        });

    if (error) {
        console.error(`❌ Gagal upload ${sanitized}:`, error.message);
        return null;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(sanitized)}`;
}

// ===== SCAN FOLDER =====
function scanFolder(folderPath, basePath = '') {
    if (!fs.existsSync(folderPath)) {
        console.warn(`⚠️ Folder not found: ${folderPath}`);
        return [];
    }

    const results = [];
    const items = fs.readdirSync(folderPath);

    for (const item of items) {
        const fullPath = path.join(folderPath, item);
        const stat = fs.statSync(fullPath);
        const relativePath = basePath ? `${basePath}/${item}` : item;

        if (stat.isDirectory()) {
            results.push(...scanFolder(fullPath, relativePath));
        } else {
            const ext = path.extname(item).toLowerCase();
            if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) continue;
            const slug = getSlugFromFilename(item);
            results.push({ slug, filePath: fullPath, destPath: relativePath, filename: item });
        }
    }
    return results;
}

// ===== UPDATE ATAU INSERT ARTWORKS =====
async function processArtworks(files) {
    console.log(`\n📤 Processing ${files.length} artwork files...`);

    const existingSlugs = await getExistingSlugs('artworks');
    const results = { updated: 0, inserted: 0, failed: 0 };

    for (const file of files) {
        console.log(`   - ${file.slug}`);

        const url = await uploadToBucket(file.filePath, 'artworks', file.destPath);
        if (!url) {
            results.failed++;
            continue;
        }

        if (existingSlugs.has(file.slug)) {
            // UPDATE
            const { error } = await supabase
                .from('artworks')
                .update({ image: url })
                .eq('slug', file.slug);
            if (error) {
                console.error(`      ❌ Update gagal:`, error.message);
                results.failed++;
            } else {
                console.log(`      ✅ Update berhasil`);
                results.updated++;
            }
        } else {
            // INSERT (kolom sesuai struktur tabel: id, slug, title, description, image, category, year, software, artist_id, featured, created_at, views)
            const now = new Date().toISOString();
            const dummy = {
                id: generateUUID(),
                slug: file.slug,
                title: file.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: 'This artwork is currently part of my personal archive. A title and detailed story will be added as the collection continues to grow.',
                image: url,
                category: 'Manip',
                year: parseInt(new Date().getFullYear().toString()),
                software: [],
                artist_id: 'e57e9b03-6b08-497c-9742-707b06aeec28', // ganti dengan ID artist default
                featured: false,
                created_at: now,
                views: 0
            };

            const { error } = await supabase
                .from('artworks')
                .insert([dummy]);
            if (error) {
                console.error(`      ❌ Insert gagal:`, error.message);
                results.failed++;
            } else {
                console.log(`      ✅ Insert berhasil (data dummy)`);
                results.inserted++;
                existingSlugs.add(file.slug);
            }
        }
    }

    return results;
}

// ===== UPDATE ATAU INSERT AVATARS =====
// Asumsi kolom artists: id, slug, name, role, bio, avatar, badge, social, services, location, specialties, joined (mungkin ada)
async function processAvatars(files) {
    console.log(`\n📤 Processing ${files.length} avatar files...`);

    const existingSlugs = await getExistingSlugs('artists');
    const results = { updated: 0, inserted: 0, failed: 0 };

    for (const file of files) {
        console.log(`   - ${file.slug}`);

        const url = await uploadToBucket(file.filePath, 'avatars', file.destPath);
        if (!url) {
            results.failed++;
            continue;
        }

        if (existingSlugs.has(file.slug)) {
            const { error } = await supabase
                .from('artists')
                .update({ avatar: url })
                .eq('slug', file.slug);
            if (error) {
                console.error(`      ❌ Update gagal:`, error.message);
                results.failed++;
            } else {
                console.log(`      ✅ Update berhasil`);
                results.updated++;
            }
        } else {
            // Insert data dummy (tanpa kolom bermasalah)
            const dummy = {
                id: generateUUID(),
                slug: file.slug,
                name: file.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                role: 'Minecraft Artist',
                bio: 'Hello, I am a Minecraft artist. This is a placeholder bio. Please update this with your actual information.',
                avatar: url,
                badge: 'new',
                social: {},
                services: ['Minecraft Art'],
                location: 'Indonesia',
                specialties: ['Manip', 'Scene'],
                joined: new Date().getFullYear().toString()
            };

            const { error } = await supabase
                .from('artists')
                .insert([dummy]);
            if (error) {
                console.error(`      ❌ Insert gagal:`, error.message);
                results.failed++;
            } else {
                console.log(`      ✅ Insert berhasil (data dummy)`);
                results.inserted++;
                existingSlugs.add(file.slug);
            }
        }
    }

    return results;
}

// ===== MAIN =====
(async () => {
    console.log('🚀 OriginGFX Uploader — One Command to Rule Them All\n');

    console.log('📁 Scanning artwork files...');
    const artworkFiles = scanFolder(ARTWORKS_DIR);
    console.log(`   Found ${artworkFiles.length} artwork files`);

    console.log('\n📁 Scanning avatar files...');
    const avatarFiles = scanFolder(AVATARS_DIR);
    console.log(`   Found ${avatarFiles.length} avatar files`);

    if (artworkFiles.length === 0 && avatarFiles.length === 0) {
        console.log('\nℹ️  No files found to upload.');
        return;
    }

    const artResults = await processArtworks(artworkFiles);
    const avatarResults = await processAvatars(avatarFiles);

    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Artworks  : ${artResults.updated} updated, ${artResults.inserted} inserted, ${artResults.failed} failed`);
    console.log(`Avatars   : ${avatarResults.updated} updated, ${avatarResults.inserted} inserted, ${avatarResults.failed} failed`);
    console.log('='.repeat(50));
    console.log('🎉 All done! Refresh your website to see changes.');
})();