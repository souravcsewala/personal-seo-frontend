import PublishBlog from '../../Pages/PublishBlog';
import { buildMeta } from '../../utils/seo';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

export default function PublishBlogPage() {
 return <PublishBlog />;
}

export const metadata = buildMeta({
 title: 'Publish Blog - RankHub',
 description: 'Create and publish a new blog post to share your SEO insights.',
 path: '/publish-blog',
});

