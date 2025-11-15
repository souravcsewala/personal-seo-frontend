import Login from '../../Pages/Login';
import { buildMeta } from '../../utils/seo';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

export default function LoginPage() {
 return <Login />;
}

export const metadata = buildMeta({
 title: 'Sign In - RankHub',
 description: 'Login to your RankHub account to join the discussion and interact.',
 path: '/login',
});


