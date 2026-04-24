import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'Librarium';
const SITE_URL = 'https://librarium40k.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  'Browse the chronicles of the Warhammer universe — books, series, primarchs, and the authors who shaped the lore.';

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const { pathname } = useLocation();
  const url = canonical ?? `${SITE_URL}${pathname}`;
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Warhammer Book Library`;

  // Escape the closing-tag sequence so a stray `</script>` inside a JSON
  // string value can never break out of the script block.
  const ldJson = jsonLd && JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {ldJson && <script type="application/ld+json">{ldJson}</script>}
    </Helmet>
  );
}
