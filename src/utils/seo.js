import { siteBaseUrl } from '../global/server';

function getBaseUrl() {
  try {
    return siteBaseUrl;
  } catch (_) {
    return 'http://localhost:3000';
  }
}

export const SITE = {
  name: 'SEOHub',
  baseUrl: getBaseUrl(),
  defaultTitle: 'SEOHub - SEO Community Forum',
  defaultDescription:
    'Join SEOHub to discover trends, share insights, and learn SEO best practices from the community.',
  defaultImage: '/logo.png',
};

export function buildCanonical(path = '/') {
  if (!path || path === '/') return SITE.baseUrl;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE.baseUrl}${normalized}`;
}

export function buildOg({ title, description, path, image } = {}) {
  const url = buildCanonical(path);
  return {
    title: title || SITE.defaultTitle,
    description: description || SITE.defaultDescription,
    url,
    type: 'website',
    images: [image || SITE.defaultImage],
    siteName: SITE.name,
  };
}

export function buildTwitter({ title, description, image } = {}) {
  return {
    card: 'summary_large_image',
    title: title || SITE.defaultTitle,
    description: description || SITE.defaultDescription,
    images: [image || SITE.defaultImage],
  };
}

export function buildMeta({ title, description, path, image } = {}) {
  const canonical = buildCanonical(path);
  return {
    title: title || SITE.defaultTitle,
    description: description || SITE.defaultDescription,
    alternates: { canonical },
    openGraph: buildOg({ title, description, path, image }),
    twitter: buildTwitter({ title, description, image }),
  };
}


