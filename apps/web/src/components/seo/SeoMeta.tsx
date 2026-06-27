import React from "react";
import { Helmet } from "react-helmet-async";

interface SeoMetaProps {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
  ogImage?: string;
}

const SeoMeta: React.FC<SeoMetaProps> = ({
  title,
  description,
  canonical,
  robots = "index,follow",
  ogImage = "https://vrnya.tech/landing-waitlist-page.png?v=20260409",
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:url" content={canonical} />
    </Helmet>
  );
};

export default SeoMeta;
