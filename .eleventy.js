// .eleventy.js
// Konfigurasi Eleventy — tanpa Supabase SDK (pakai fetch di _data/supabase.js)

require('dotenv').config();

module.exports = function(eleventyConfig) {
    // --- Copy assets ke output (_site) ---
    eleventyConfig.addPassthroughCopy('src/assets');
    eleventyConfig.addPassthroughCopy('src/images');

    // --- Filter untuk path (aman di Netlify) ---
    eleventyConfig.addFilter("url", function(value) {
        if (!value) return value;
        return value.startsWith("/") ? value : "/" + value;
    });

    // --- Konfigurasi folder ---
    return {
        dir: {
            input: 'src',
            output: '_site',
            includes: '_includes',
            data: '_data'   // ← Eleventy otomatis baca file .js di sini
        }
    };
};