import Profile from '../../Pages/Profile';
import { buildMeta } from '../../utils/seo';

export default function ProfilePage() {
  return <Profile />;
}

export const metadata = buildMeta({
  title: 'Your Profile - SEOHub',
  description: 'View and edit your profile, preferences, and activity on SEOHub.',
  path: '/profile',
});

