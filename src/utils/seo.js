import { siteBaseUrl } from '../global/server';

function getBaseUrl() {
 try {
  return siteBaseUrl;
 } catch (_) {
  return 'http://localhost:3000';
 }
}

export const SITE = {
 name: 'RankHub',
 baseUrl: getBaseUrl(),
 defaultTitle: 'RankHub - SEO Community Forum',
 defaultDescription:
  'Join RankHub to discover trends, share insights, and learn SEO best practices from the community.',
 defaultImage: '/logo.png',
};

export function buildCanonical(path = '/') {
 if (!path || path === '/') {
  // Remove trailing slash from base URL
  return SITE.baseUrl.replace(/\/+$/, '') || SITE.baseUrl;
 }
 // Remove trailing slash from base URL and normalize path
 const baseUrl = SITE.baseUrl.replace(/\/+$/, '');
 const normalized = path.startsWith('/') ? path : `/${path}`;
 return `${baseUrl}${normalized}`;
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
  metadataBase: new URL(SITE.baseUrl),
  title: title || SITE.defaultTitle,
  description: description || SITE.defaultDescription,
  alternates: { canonical },
  openGraph: buildOg({ title, description, path, image }),
  twitter: buildTwitter({ title, description, image }),
 };
}


