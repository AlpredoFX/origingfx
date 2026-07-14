// netlify/functions/update-views.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // Ambil slug dari query string
    const slug = event.queryStringParameters.slug;
    if (!slug) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Slug is required' })
        };
    }

    // Inisialisasi Supabase dengan service_role key (AMAN di server)
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

    try {
        // Panggil fungsi increment_views di database
        const { data, error } = await supabase.rpc('increment_views', {
            slug_param: slug
        });

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                views: data 
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false, 
                error: error.message 
            })
        };
    }
};