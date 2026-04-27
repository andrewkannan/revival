'use client';

import React, { useState, useMemo } from 'react';
import { RegistrationStatus, Registration, Attendee, OutreachLocation } from '@prisma/client';
import { BadgeCheck, Clock, XCircle, AlertCircle, Search, X, Edit2 } from 'lucide-react';
import StatusSelect from '@/components/admin/StatusSelect';
import EditRegistrationModal, { EditData } from '@/components/admin/EditRegistrationModal';
import { motion, AnimatePresence } from 'framer-motion';

type RegistrationWithAttendee = Omit<Registration, 'totalAmount'> & { 
  totalAmount: string;
  orderNumber: number;
  attendee: Attendee; 
};

interface Props {
  initialData: RegistrationWithAttendee[];
}

export default function RegistrationsTable({ initialData }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>('ALL');
  const [outreachFilter, setOutreachFilter] = useState<OutreachLocation | 'ALL'>('ALL');
  const [receiptModal, setReceiptModal] = useState<{ url: string; queueNum: string } | null>(null);
  const [editingData, setEditingData] = useState<EditData | null>(null);

  const formatQueue = (num: number) => 'R' + String(num).padStart(5, '0');

  const getStatusIcon = (status: RegistrationStatus) => {
    switch (status) {
      case 'SEAT_SECURED': return <BadgeCheck className="w-4 h-4 text-emerald-400" />;
      case 'PENDING_FOR_PAYMENT': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'PENDING_FOR_REVIEW': return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case 'PAYMENT_REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
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
          <option value="PAYMENT_REJECTED">Payment Rejected</option>
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
                <th className="px-6 py-4 font-medium">Queue No.</th>
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
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
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
                    } ${reg.status === 'PENDING_FOR_REVIEW' ? 'bg-poster-accent/10 border-l-4 border-l-poster-accent' : 
                        reg.status === 'PAYMENT_REJECTED' ? 'bg-red-500/10 border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}`}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-poster-accent">
                      {formatQueue(reg.orderNumber)}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {reg.attendee.name}
                    </td>
                    <td className="px-6 py-4">
                      <div>{reg.attendee.email}</div>
                      <div className="text-slate-500 text-xs mt-1 flex items-center gap-2">
                        {reg.attendee.phone}
                        <a 
                          href={`https://wa.me/${reg.attendee.phone.replace(/[^0-9]/g, '')}?text=Hi ${encodeURIComponent(reg.attendee.name)}, regarding your REVIVAL registration...`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 transition-colors"
                          title="Message on WhatsApp"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                          </svg>
                        </a>
                      </div>
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
                          onClick={() => setReceiptModal({ url: reg.receiptUrl!, queueNum: formatQueue(reg.orderNumber) })}
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
                      <div className="flex items-center gap-2">
                        <StatusSelect registrationId={reg.id} currentStatus={reg.status} />
                        <button 
                          onClick={() => setEditingData({
                            id: reg.id,
                            attendeeId: reg.attendee.id,
                            name: reg.attendee.name,
                            email: reg.attendee.email,
                            phone: reg.attendee.phone,
                            outreach: reg.attendee.outreach,
                            totalAmount: reg.totalAmount,
                            status: reg.status,
                            receiptUrl: reg.receiptUrl,
                            orderNumber: reg.orderNumber
                          })}
                          className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
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
        {receiptModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setReceiptModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-[#1c272a] border border-white/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-semibold text-white">Payment Receipt - {receiptModal.queueNum}</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={receiptModal.url}
                    download={`${receiptModal.queueNum}_Receipt.jpg`}
                    className="px-4 py-2 bg-poster-accent text-poster-bg text-sm font-medium rounded-lg hover:bg-poster-accent-bright transition-colors"
                  >
                    Download Receipt
                  </a>
                  <button onClick={() => setReceiptModal(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white ml-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="overflow-auto p-4 flex justify-center items-center bg-black/50 min-h-[50vh]">
                <img src={receiptModal.url} alt="Payment Receipt" className="max-w-full h-auto rounded-xl shadow-2xl" />
              </div>
            </motion.div>
          </motion.div>
        )}

        {editingData && (
          <EditRegistrationModal 
            data={editingData} 
            onClose={() => setEditingData(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
