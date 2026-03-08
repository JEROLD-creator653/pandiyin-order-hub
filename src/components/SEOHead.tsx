import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'PANDIYIN - Nature In Pack';
const SITE_URL = 'https://pandiyin-nature-in-pack.web.app';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const TWITTER_HANDLE = '@pandiyin_nature';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: 'website' | 'product' | 'article';
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  noIndex?: boolean;
  product?: {
    price: number;
    currency?: string;
    availability?: 'in stock' | 'out of stock';
    condition?: string;
  };
  jsonLd?: Record<string, any> | Record<string, any>[];
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function SEOHead({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage,
  ogImageWidth = 1200,
  ogImageHeight = 630,
  noIndex = false,
  product,
  jsonLd,
}: SEOHeadProps) {
  const location = useLocation();
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical || `${SITE_URL}${location.pathname}`;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const desc = description.slice(0, 160);

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Basic meta
    setMeta('description', desc);
    setMeta('author', 'PANDIYIN Nature In Pack');
    setMeta('theme-color', '#2d6a4f');
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1');

    // Canonical
    setLink('canonical', canonicalUrl);

    // Open Graph
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', desc, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:type', ogType, true);
    setMeta('og:site_name', SITE_NAME, true);
    setMeta('og:locale', 'en_IN', true);
    setMeta('og:image', image, true);
    setMeta('og:image:width', String(ogImageWidth), true);
    setMeta('og:image:height', String(ogImageHeight), true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', image);
    setMeta('twitter:site', TWITTER_HANDLE);

    // Product meta
    if (product) {
      setMeta('product:price:amount', String(product.price), true);
      setMeta('product:price:currency', product.currency || 'INR', true);
      setMeta('product:availability', product.availability || 'in stock', true);
      setMeta('product:condition', product.condition || 'new', true);
    }

    // JSON-LD
    // Remove old ones
    document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());
    const schemas = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    schemas.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());
    };
  }, [fullTitle, desc, canonicalUrl, ogType, image, noIndex, product, jsonLd, ogImageWidth, ogImageHeight]);

  return null;
}

// Reusable schema builders
export const schemas = {
  organization: () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PANDIYIN Nature In Pack',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.ico`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-6383709933',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Tamil'],
    },
    sameAs: ['https://www.instagram.com/pandiyin_nature_in_pack'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '802, VPM House, Mandhaikaliamman Kovil Street, Krishnapuram Road',
      addressLocality: 'M. Kallupatti',
      addressRegion: 'Tamil Nadu',
      postalCode: '625535',
      addressCountry: 'IN',
    },
  }),

  website: () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }),

  product: (p: {
    name: string;
    description: string;
    image: string | string[];
    price: number;
    comparePrice?: number | null;
    sku: string;
    available: boolean;
    rating?: number | null;
    reviewCount?: number | null;
    category?: string;
  }) => {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description?.replace(/<[^>]*>/g, '').slice(0, 500) || '',
      image: Array.isArray(p.image) ? p.image : [p.image],
      sku: p.sku,
      brand: { '@type': 'Brand', name: 'PANDIYIN' },
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/products/${p.sku}`,
        priceCurrency: 'INR',
        price: p.price,
        itemCondition: 'https://schema.org/NewCondition',
        availability: p.available
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: 'PANDIYIN Nature In Pack' },
      },
    };
    if (p.rating && p.reviewCount && p.reviewCount > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: p.rating,
        reviewCount: p.reviewCount,
      };
    }
    if (p.category) {
      schema.category = p.category;
    }
    return schema;
  },

  breadcrumbs: (items: { name: string; url?: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: `${SITE_URL}${item.url}` } : {}),
    })),
  }),
};
