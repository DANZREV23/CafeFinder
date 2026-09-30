
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getCanonicalUrl, PUBLIC_SITE_URL } from '@/utils/seoUtils';
import { useI18n } from '@/i18n';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'place';
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
  children?: React.ReactNode;
  jsonLd?: any;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noindex = false,
  children,
  jsonLd
}) => {
  const location = useLocation();
  const { locale } = useI18n();
  
  const siteTitle = 'CafeFinder';
  const fullTitle = title ? `${title} | ${siteTitle}` : 'Find Your Next Favorite Cafe | CafeFinder';
  const defaultDescription = 'Discover cafes by location, vibe, coffee type, Wi-Fi, amenities, reviews, and more. Your ultimate guide to the best coffee shops.';
  const metaDescription = description || defaultDescription;
  
  const currentCanonical = canonical || getCanonicalUrl(location.pathname);
  const currentOgImage = ogImage || `${PUBLIC_SITE_URL}/og-default.png`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={locale} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={currentCanonical} />
      <link rel="alternate" href={currentCanonical} hrefLang={locale} />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph */}
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={currentCanonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={currentOgImage} />
      <meta property="og:locale" content={locale.replace('-', '_')} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={currentOgImage} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}

      {children}
    </Helmet>
  );
};
