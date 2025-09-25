import Register from '../../Pages/Register';
import { prodServerUrl } from '../../global/server';
import { buildMeta } from '../../utils/seo';

async function fetchCategories() {
  try {
    const res = await fetch(`${prodServerUrl}/get-all-category`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    // backend returns { success, data: items }
    return Array.isArray(json?.data) ? json.data : [];
  } catch (_) {
    return [];
  }
}

export default async function RegisterPage() {
  const categories = await fetchCategories();
  return <Register categories={categories} />;
}

export const metadata = buildMeta({
  title: 'Create Account - SEOHub',
  description: 'Register on SEOHub to personalize your experience and publish content.',
  path: '/register',
});


