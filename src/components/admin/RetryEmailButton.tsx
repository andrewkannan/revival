'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { retryEmail } from '@/actions/admin';

export default function RetryEmailButton({ logId }: { logId: string }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    const { success, message } = await retryEmail(logId);
    setIsRetrying(false);
    
    if (success) {
      alert('Email sent successfully!');
    } else {
      alert('Failed to send email: ' + message);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={isRetrying}
      title="Retry sending this email"
      className="ml-4 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
    >
      <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
    </button>
  );
}
