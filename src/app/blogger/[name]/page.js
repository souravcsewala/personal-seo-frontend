import BloggerProfile from '../../../Pages/BloggerProfile';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

export default function BloggerProfilePage() {
 return <BloggerProfile />;
}
