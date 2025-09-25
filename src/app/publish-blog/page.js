import PublishBlog from '../../Pages/PublishBlog';
import { buildMeta } from '../../utils/seo';

export default function PublishBlogPage() {
  return <PublishBlog />;
}

export const metadata = buildMeta({
  title: 'Publish Blog - SEOHub',
  description: 'Create and publish a new blog post to share your SEO insights.',
  path: '/publish-blog',
});

