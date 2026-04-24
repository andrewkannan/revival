'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react';
import { logoutAdmin } from '@/actions/admin';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Registrations', href: '/admin/registrations', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Do not show sidebar on the login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await logoutAdmin();
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 bg-black flex flex-col fixed inset-y-0 z-50">
        <div className="p-6 border-b border-white/10 flex items-center justify-center">
          <Link href="/admin" className="text-xl font-bold tracking-widest text-white">
            REVIVAL<span className="text-slate-500 text-xs ml-2">ADMIN</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={twMerge(
                  clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200',
                    isActive 
                      ? 'bg-white text-black' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )
                )}
              >
                <item.icon className={clsx("w-5 h-5", isActive ? "text-black" : "")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 bg-black">
        <main className="p-8 max-w-6xl mx-auto min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
