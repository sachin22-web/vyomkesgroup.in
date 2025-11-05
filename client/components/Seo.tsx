import React from 'react';
import { Helmet } from 'react-helmet-async'; // Using react-helmet-async for SEO management

interface SeoProps {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
}

export function Seo({ title, description, keywords, ogImage, ogUrl }: SeoProps) {
  const defaultTitle = "Vyomkesh Industries";
  const fullTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const defaultDescription = "Secure Your Future with High-Return Investment Plans from Vyomkesh Industries.";
  const defaultKeywords = "investment, finance, high-return, plans, wealth, Vyomkesh Industries";
  const defaultOgImage = `${window.location.origin}/icons/icon-512x512.png`; // Default Open Graph image
  const defaultOgUrl = window.location.href;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={ogUrl || defaultOgUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={ogImage || defaultOgImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={ogUrl || defaultOgUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description || defaultDescription} />
      <meta property="twitter:image" content={ogImage || defaultOgImage} />
    </Helmet>
  );
}