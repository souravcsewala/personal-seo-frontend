import PollDetail from '../../../Pages/PollDetail';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

export default function PollDetailPage() {
 return <PollDetail />;
}


