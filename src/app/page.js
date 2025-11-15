import Home from '../Pages/Home';
import { prodServerUrl } from '../global/server';
import { buildMeta } from '../utils/seo';

// Force dynamic rendering to avoid prerender/export errors
export const dynamic = 'force-dynamic';

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
 title: 'Latest SEO Insights - RankHub',
 description: 'Discover the latest SEO trends, tips, and strategies from the community feed.',
 path: '/',
});
