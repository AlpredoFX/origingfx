module.exports = function(eleventyConfig) {
    // Copy folder assets ke output (_site)
    eleventyConfig.addPassthroughCopy('src/assets');
    eleventyConfig.addPassthroughCopy('src/images');

    return {
        dir: {
            input: 'src',
            output: '_site',
            includes: '_includes',
            data: '_data'
        }
    };
};
