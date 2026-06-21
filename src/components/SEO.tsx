// SEO Component for meta tags and structured data
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'ConstructoraGT - Soluciones Digitales para la Construcción',
  description = 'Software, diseños y servicios de construcción para Guatemala. Calculadora de costos, productos digitales y servicios profesionales.',
  canonical = window.location.href,
  ogImage = 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473307230_44576eec.png',
  ogType = 'website',
  keywords = 'construcción, guatemala, software construcción, calculadora construcción, planos arquitectónicos',
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'ConstructoraGT',
          description,
          url: canonical,
          image: ogImage,
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'GT',
            addressRegion: 'Guatemala',
          },
          priceRange: '$$',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '127',
          },
        })}
      </script>
    </Helmet>
  );
};

export default SEO;