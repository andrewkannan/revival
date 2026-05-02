'use client';

import { useState } from 'react';
import { enqueueBulkEmails } from '@/actions/admin';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Registrations' },
  { value: 'SEAT_SECURED', label: 'Seat Secured' },
  { value: 'PENDING_FOR_PAYMENT', label: 'Pending Payment' },
  { value: 'PENDING_FOR_REVIEW', label: 'Pending Review' },
  { value: 'PAYMENT_REJECTED', label: 'Payment Rejected' },
  { value: 'CONTACT_ADMIN', label: 'Contact Admin' },
];

export default function ReminderButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['SEAT_SECURED']);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedStatuses(values);
  };

  const handleSend = async () => {
    if (selectedStatuses.length === 0) {
      alert("Please select at least one status.");
      return;
    }

    if (!confirm(`Are you sure you want to bulk send emails to: ${selectedStatuses.join(', ')}?`)) {
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    const res = await enqueueBulkEmails(selectedStatuses);
    setResult(res);
    setLoading(false);

    if (res.success) {
      setTimeout(() => setResult(null), 5000);
    }
  };

  return (
    <div className="flex flex-col items-end gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
      <div className="flex items-center gap-4 w-full">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-400 mb-1">Target Status(es)</label>
          <select 
            multiple 
            value={selectedStatuses} 
            onChange={handleStatusChange}
            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-white/30 h-24"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
        </div>
        <button
          onClick={handleSend}
          disabled={loading || selectedStatuses.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 h-max whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Bulk Send Emails
        </button>
      </div>
      
      {result && (
        <div className={`flex items-center gap-2 text-sm w-full p-2 rounded ${result.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {result.success && <CheckCircle2 className="w-4 h-4" />}
          {result.message}
        </div>
      )}
    </div>
  );
}
