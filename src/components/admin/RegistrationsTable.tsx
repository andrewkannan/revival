'use client';

import React, { useState, useMemo } from 'react';
import { RegistrationStatus, Registration, Attendee, OutreachLocation } from '@prisma/client';
import { BadgeCheck, Clock, XCircle, AlertCircle, Search, X } from 'lucide-react';
import StatusSelect from '@/components/admin/StatusSelect';
import { motion, AnimatePresence } from 'framer-motion';

type RegistrationWithAttendee = Omit<Registration, 'totalAmount'> & { 
  totalAmount: string;
  attendee: Attendee; 
};

interface Props {
  initialData: RegistrationWithAttendee[];
}

export default function RegistrationsTable({ initialData }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>('ALL');
  const [outreachFilter, setOutreachFilter] = useState<OutreachLocation | 'ALL'>('ALL');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const getStatusIcon = (status: RegistrationStatus) => {
    switch (status) {
      case 'SEAT_SECURED': return <BadgeCheck className="w-4 h-4 text-emerald-400" />;
      case 'PENDING_FOR_PAYMENT': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'PENDING_FOR_REVIEW': return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case 'CONTACT_ADMIN': return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = initialData.filter(reg => {
      // Status filter
      if (statusFilter !== 'ALL' && reg.status !== statusFilter) return false;
      
      // Outreach filter
      if (outreachFilter !== 'ALL' && reg.attendee.outreach !== outreachFilter) return false;
      
      // Search filter
      if (search) {
        const query = search.toLowerCase();
        if (
          !reg.attendee.name.toLowerCase().includes(query) &&
          !reg.attendee.email.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });

    // Sort: PENDING_FOR_REVIEW first, then by createdAt desc
    result.sort((a, b) => {
      if (a.status === 'PENDING_FOR_REVIEW' && b.status !== 'PENDING_FOR_REVIEW') return -1;
      if (a.status !== 'PENDING_FOR_REVIEW' && b.status === 'PENDING_FOR_REVIEW') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [initialData, search, statusFilter, outreachFilter]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_FOR_PAYMENT">Pending Payment</option>
          <option value="PENDING_FOR_REVIEW">Pending Review</option>
          <option value="SEAT_SECURED">Seat Secured</option>
          <option value="CONTACT_ADMIN">Contact Admin</option>
        </select>

        <select
          value={outreachFilter}
          onChange={(e) => setOutreachFilter(e.target.value as any)}
          className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="ALL">All Locations</option>
          <option value="JOHOR_BAHRU">Johor Bahru</option>
          <option value="ISKANDAR_PUTERI">Iskandar Puteri</option>
          <option value="TAMAN_DAYA">Taman Daya</option>
          <option value="PELANGI_INDAH">Pelangi Indah</option>
          <option value="MELAKA">Melaka</option>
          <option value="SIMPANG_RENGGAM">Simpang Renggam</option>
          <option value="OTHERS">Others</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Attendee</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Tickets</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Receipt</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 mb-2 opacity-50" />
                      <p>No registrations match your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((reg) => (
                  <tr 
                    key={reg.id} 
                    className={`border-b border-white/5 transition-all duration-300 ${
                      reg.status === 'SEAT_SECURED' ? 'bg-black/80 opacity-50 grayscale hover:grayscale-0 hover:opacity-100' : 'hover:bg-white/[0.04]'
                    } ${reg.status === 'PENDING_FOR_REVIEW' ? 'bg-poster-accent/10 border-l-4 border-l-poster-accent' : 'border-l-4 border-l-transparent'}`}
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {reg.attendee.name}
                    </td>
                    <td className="px-6 py-4">
                      <div>{reg.attendee.email}</div>
                      <div className="text-slate-500 text-xs mt-1">{reg.attendee.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {reg.attendee.outreach.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <div>{reg.adultTickets} Adult</div>
                      {reg.kidsTickets > 0 && <div className="text-slate-500 text-xs mt-1">{reg.kidsTickets} Kids</div>}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      RM {reg.totalAmount}
                    </td>
                    <td className="px-6 py-4">
                      {reg.receiptUrl ? (
                        <button 
                          onClick={() => setReceiptImage(reg.receiptUrl)}
                          className="text-poster-accent hover:text-poster-accent-bright underline text-xs font-medium cursor-pointer transition-colors"
                        >
                          View Proof
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs">No Receipt</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(reg.status)}
                        <span className="text-xs font-medium">
                          {reg.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusSelect registrationId={reg.id} currentStatus={reg.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {receiptImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setReceiptImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-[#1c272a] border border-white/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-semibold text-white">Payment Receipt</h3>
                <button onClick={() => setReceiptImage(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-auto p-4 flex justify-center items-center bg-black/50 min-h-[50vh]">
                <img src={receiptImage} alt="Payment Receipt" className="max-w-full h-auto rounded-xl shadow-2xl" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
