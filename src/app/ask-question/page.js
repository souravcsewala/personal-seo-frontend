'use client';

import AskQuestion from '../../Pages/AskQuestion';

// Force dynamic rendering to prevent prerender errors with client hooks
export const dynamic = 'force-dynamic';

export default function AskQuestionPage() {
 return <AskQuestion />;
}

