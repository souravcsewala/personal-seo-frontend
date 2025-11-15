import Profile from '../../Pages/Profile';
import { buildMeta } from '../../utils/seo';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
 return <Profile />;
}

export const metadata = buildMeta({
 title: 'Your Profile - RankHub',
 description: 'View and edit your profile, preferences, and activity on RankHub.',
 path: '/profile',
});

