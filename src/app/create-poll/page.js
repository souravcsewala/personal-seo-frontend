import CreatePoll from '../../Pages/CreatePoll';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

export default function CreatePollPage() {
 return <CreatePoll />;
}

