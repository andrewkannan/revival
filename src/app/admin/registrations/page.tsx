import prisma from '@/lib/prisma';
import { updateRegistrationStatus } from '@/actions/admin';

export const dynamic = 'force-dynamic';
import { RegistrationStatus } from '@prisma/client';
import { BadgeCheck, Clock, XCircle, AlertCircle } from 'lucide-react';

export default async function RegistrationsPage() {
  const registrations = await prisma.registration.findMany({
    include: {
      attendee: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const getStatusIcon = (status: RegistrationStatus) => {
    switch (status) {
      case 'SEAT_SECURED': return <BadgeCheck className="w-4 h-4 text-emerald-400" />;
      case 'PENDING_FOR_PAYMENT': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'PENDING_FOR_REVIEW': return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case 'CONTACT_ADMIN': return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registrations</h1>
        <p className="text-slate-400 mt-2">View and manage all attendees and their payment statuses.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-white/5 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Attendee</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Tickets</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
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
                      RM {reg.totalAmount.toString()}
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
                      <form action={async (formData) => {
                        'use server';
                        const status = formData.get('status') as RegistrationStatus;
                        await updateRegistrationStatus(reg.id, status);
                      }}>
                        <select 
                          name="status"
                          defaultValue={reg.status}
                          onChange={(e) => e.target.form?.requestSubmit()}
                          className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-white/30"
                        >
                          <option value="PENDING_FOR_PAYMENT">Pending Payment</option>
                          <option value="PENDING_FOR_REVIEW">Pending Review</option>
                          <option value="SEAT_SECURED">Seat Secured</option>
                          <option value="CONTACT_ADMIN">Contact Admin</option>
                        </select>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
