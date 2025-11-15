import Network from '../../Pages/Network';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

export default function NetworkPage() {
 return <Network />;
}


