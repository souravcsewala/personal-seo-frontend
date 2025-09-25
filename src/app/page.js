import Home from '../Pages/Home';
import { prodServerUrl } from '../global/server';
import { buildMeta } from '../utils/seo';

export default async function Page() {
  let initialFeed = [];
  try {
    const res = await fetch(`${prodServerUrl}/feed/public?limit=30&page=1`, { cache: 'no-store' });
    const json = await res.json();
    initialFeed = Array.isArray(json?.data) ? json.data : [];
  } catch (_) {}
  return <Home initialFeed={initialFeed} />;
}

export const metadata = buildMeta({
  title: 'Latest SEO Insights - SEOHub',
  description: 'Discover the latest SEO trends, tips, and strategies from the community feed.',
  path: '/',
});
