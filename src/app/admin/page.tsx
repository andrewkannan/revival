import { getDashboardStats } from '@/actions/admin';
import { getActiveLocksCount } from '@/lib/ticket-lock';
import { Users, Ticket, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const activeLocks = await getActiveLocksCount();

  const totalTaken = stats.securedSeats + stats.pendingSeats + activeLocks;
  const availableSeats = Math.max(0, stats.capacity - totalTaken);
  const fillPercentage = Math.min(100, Math.round((totalTaken / stats.capacity) * 100));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-400 mt-2">Real-time capacity and registration statistics.</p>
      </div>

      {/* Main Capacity Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Ticket className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-lg font-medium text-slate-400 mb-2">Total Capacity Remaining</h2>
          <div className="flex items-baseline gap-4">
            <span className="text-6xl font-bold tracking-tighter">{availableSeats}</span>
            <span className="text-xl text-slate-500 font-medium">/ {stats.capacity} seats</span>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-slate-400">Filled ({fillPercentage}%)</span>
              <span className="text-white">{totalTaken} taken</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-medium text-slate-400">Total Groups</h3>
          </div>
          <p className="text-3xl font-bold">{stats.totalRegistrations}</p>
          <p className="text-sm text-slate-500 mt-1">Unique registrations</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-medium text-slate-400">Secured</h3>
          </div>
          <p className="text-3xl font-bold">{stats.securedSeats}</p>
          <p className="text-sm text-slate-500 mt-1">Paid tickets</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="font-medium text-slate-400">Pending</h3>
          </div>
          <p className="text-3xl font-bold">{stats.pendingSeats}</p>
          <p className="text-sm text-slate-500 mt-1">Awaiting payment/review</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-medium text-slate-400">Active Locks</h3>
          </div>
          <p className="text-3xl font-bold">{activeLocks}</p>
          <p className="text-sm text-slate-500 mt-1">Currently checking out</p>
        </div>
      </div>
    </div>
  );
}
