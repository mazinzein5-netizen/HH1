import { Helmet } from "react-helmet-async";

const SITE_NAME = "Health HIVE";
const SITE_URL = "https://healthhive.ie";
const DEFAULT_IMAGE = `${SITE_URL}/opengraph.jpg`;
const DEFAULT_IMAGE_ALT =
  "Health HIVE — safe, auditable digitisation of patient files for primary and secondary care in Ireland";

interface PageHeadProps {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  keywords?: string;
  jsonLd?: object[];
}

export function PageHead({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_IMAGE,
  ogImageAlt = DEFAULT_IMAGE_ALT,
  keywords,
  jsonLd,
}: PageHeadProps) {
  const canonical = `${SITE_URL}${path}`;
  const resolvedOgTitle = ogTitle ?? title;
  const resolvedOgDescription = ogDescription ?? description;

  return (
    <Helmet>
      <title>{title} | {SITE_NAME}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IE" />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={ogImageAlt} />
      {jsonLd?.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
