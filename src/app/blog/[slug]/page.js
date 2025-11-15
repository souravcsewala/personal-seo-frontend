import BlogDetail from '../../../Pages/BlogDetail';
import { prodServerUrl } from '../../../global/server';
import { buildMeta } from '../../../utils/seo';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

export default async function BlogDetailPage({ params }) {
 const { slug } = await params;
 let initialBlog = null;
 try {
  if (slug) {
   const res = await fetch(`${prodServerUrl}/blogs/${encodeURIComponent(slug)}`, { cache: 'no-store' });
   const json = await res.json();
   initialBlog = json?.data || null;
  }
 } catch (_) {}
 return <BlogDetail initialBlog={initialBlog} />;
}

export async function generateMetadata({ params }) {
 const { slug } = await params;
 try {
  if (slug) {
   const res = await fetch(`${prodServerUrl}/blogs/${encodeURIComponent(slug)}`, { cache: 'no-store' });
   const json = await res.json();
   const b = json?.data;
   if (b) {
    return buildMeta({
     title: b.title,
     description: b.metaDescription,
     path: `/blog/${slug}`,
     image: b.image || b.signedUrl,
    });
   }
  }
 } catch (_) {}
 return buildMeta({ path: `/blog/${slug}` });
}


