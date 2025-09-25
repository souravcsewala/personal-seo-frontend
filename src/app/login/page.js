import Login from '../../Pages/Login';
import { buildMeta } from '../../utils/seo';

export default function LoginPage() {
  return <Login />;
}

export const metadata = buildMeta({
  title: 'Sign In - SEOHub',
  description: 'Login to your SEOHub account to join the discussion and interact.',
  path: '/login',
});


