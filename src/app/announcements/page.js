import Announcements from '../../Pages/Announcements';
import { buildMeta } from '../../utils/seo';

// Force dynamic rendering to always show latest list
export const dynamic = 'force-dynamic';

export default function Page() {
 return <Announcements />;
}

export const metadata = buildMeta({
 title: 'Announcements - RankHub',
 description: 'Browse all announcements from the RankHub community.',
 path: '/announcements',
});


