
export const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;

export const getCanonicalUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Remove query parameters and trailing slashes for canonicalization
  const baseUrl = `${PUBLIC_SITE_URL}${cleanPath}`.split('?')[0].replace(/\/$/, '');
  return baseUrl || PUBLIC_SITE_URL;
};

export const generateBreadcrumbJsonLd = (items: { name: string; item: string }[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.item.startsWith('http') ? item.item : `${PUBLIC_SITE_URL}${item.item}`
    }))
  };
};

export const generateCafeJsonLd = (cafe: any) => {
  if (!cafe) return null;

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    "name": cafe.name,
    "description": cafe.shortDescription || cafe.description,
    "url": `${PUBLIC_SITE_URL}/cafes/${cafe.slug}`,
    "image": cafe.coverImage || `${PUBLIC_SITE_URL}/og-default.png`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": cafe.address,
      "addressLocality": cafe.city,
      "addressRegion": cafe.state,
      "addressCountry": cafe.country || "PH"
    }
  };

  if (cafe.phone) jsonLd.telephone = cafe.phone;
  if (cafe.latitude && cafe.longitude) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      "latitude": cafe.latitude,
      "longitude": cafe.longitude
    };
  }

  if (cafe.priceRange) {
    jsonLd.priceRange = cafe.priceRange;
  }

  if (cafe.avgRating && cafe.totalReviews > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": cafe.avgRating,
      "reviewCount": cafe.totalReviews,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  return jsonLd;
};

export const generateBlogArticleJsonLd = (post: any) => {
  if (!post) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.content.substring(0, 160),
    "image": post.coverImage,
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt || post.publishedAt,
    "author": {
      "@type": "Person",
      "name": post.author?.name || "CafeFinder Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "CafeFinder",
      "logo": {
        "@type": "ImageObject",
        "url": `${PUBLIC_SITE_URL}/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${PUBLIC_SITE_URL}/blog/${post.slug}`
    }
  };
};

export const generateItemListJsonLd = (list: any) => {
  if (!list || !list.items) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": list.title,
    "description": list.description,
    "itemListElement": list.items
      .filter((item: any) => item.cafe && item.cafe.status === 'PUBLISHED')
      .map((item: any, index: number) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `${PUBLIC_SITE_URL}/cafes/${item.cafe.slug}`,
        "name": item.cafe.name
      }))
  };
};
