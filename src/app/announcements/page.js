import Announcements from '../../Pages/Announcements';
import { buildMeta } from '../../utils/seo';

// Force dynamic rendering to always show latest list
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return <Announcements />;
}

export const metadata = buildMeta({
  title: 'Announcements - SEOHub',
  description: 'Browse all announcements from the SEOHub community.',
  path: '/announcements',
});


