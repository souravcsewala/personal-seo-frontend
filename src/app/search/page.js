import SearchPage from '../../Pages/Search';
import { buildMeta } from '../../utils/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return <SearchPage />;
}

export const metadata = buildMeta({
  title: 'Search Blogs - SEOHub',
  description: 'Search blogs by title, meta description, and author on SEOHub.',
  path: '/search',
});


