import QuestionDetail from '../../../Pages/QuestionDetail';
import { prodServerUrl } from '../../../global/server';
import { buildCanonical } from '../../../utils/seo';

export async function generateMetadata({ params }) {
 const { slug } = await params;
 try {
  const res = await fetch(`${prodServerUrl}/questions/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed');
  const json = await res.json();
  const q = json?.data || {};
  const raw = String(q.description || '');
  const plain = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const description = plain.length > 160 ? plain.slice(0, 157) + '…' : (plain || 'Explore this SEO question on RankHub.');
  const title = String(q?.slug || slug);
  const path = `/question/${encodeURIComponent(q.slug || slug)}`;
  const canonical = buildCanonical(path);
  return {
   title,
   description,
   alternates: { canonical },
   openGraph: {
    title,
    description,
    url: canonical,
    type: 'article',
   },
   robots: {
    index: true,
    follow: true,
   },
  };
 } catch (_) {
  const fallbackCanonical = buildCanonical(`/question/${encodeURIComponent(slug)}`);
  return {
   title: String(slug),
   description: 'Explore this SEO question on RankHub.',
   alternates: { canonical: fallbackCanonical },
  };
 }
}

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

export default function QuestionDetailPage() {
 return <QuestionDetail />;
}


