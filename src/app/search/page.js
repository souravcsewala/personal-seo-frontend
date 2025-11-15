import SearchPage from '../../Pages/Search';
import { buildMeta } from '../../utils/seo';

export const dynamic = 'force-dynamic';

export default function Page() {
 return <SearchPage />;
}

export const metadata = buildMeta({
 title: 'Search Blogs - RankHub',
 description: 'Search blogs by title, meta description, and author on RankHub.',
 path: '/search',
});


