module.exports = function(eleventyConfig) {
    // Copy semua assets ke output (_site)
    eleventyConfig.addPassthroughCopy('src/assets');
    eleventyConfig.addPassthroughCopy('src/images');

    // Filter untuk path (biar aman di Netlify)
    eleventyConfig.addFilter("url", function(value) {
        if (!value) return value;
        return value.startsWith("/") ? value : "/" + value;
    });

    return {
        dir: {
            input: 'src',
            output: '_site',
            includes: '_includes',
            data: '_data'
        }
    };
};