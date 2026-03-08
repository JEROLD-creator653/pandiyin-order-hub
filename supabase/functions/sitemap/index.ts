import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://pandiyin-nature-in-pack.web.app';

const staticPages = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/products', changefreq: 'daily', priority: '0.9' },
  { loc: '/about', changefreq: 'monthly', priority: '0.6' },
  { loc: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
  { loc: '/return-refund', changefreq: 'yearly', priority: '0.3' },
  { loc: '/shipping-policy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/cancellation-policy', changefreq: 'yearly', priority: '0.3' },
];

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function formatDate(d: string): string {
  return new Date(d).toISOString().split('T')[0];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch products and categories
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('id, name, updated_at, image_url, images, is_available').eq('is_available', true),
      supabase.from('categories').select('id, name, created_at'),
    ]);

    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];
    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Category pages
    for (const cat of categories) {
      xml += `  <url>
    <loc>${SITE_URL}/products?category=${encodeURIComponent(cat.id)}</loc>
    <lastmod>${formatDate(cat.created_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Product pages with images
    for (const p of products) {
      const images: string[] = [];
      if (p.image_url) images.push(p.image_url);
      if (p.images && Array.isArray(p.images)) {
        for (const img of p.images) {
          if (img && !images.includes(img)) images.push(img);
        }
      }

      xml += `  <url>
    <loc>${SITE_URL}/products/${p.id}</loc>
    <lastmod>${formatDate(p.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
`;
      for (const img of images.slice(0, 5)) {
        xml += `    <image:image>
      <image:loc>${escapeXml(img)}</image:loc>
      <image:title>${escapeXml(p.name)}</image:title>
    </image:image>
`;
      }
      xml += `  </url>
`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
    });
  }
});
