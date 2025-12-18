'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    UtensilsCrossed,
    Users,
    Bike,
    BarChart3,
    LogOut
} from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const menuItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
        { name: 'Restaurants', href: '/dashboard/restaurants', icon: UtensilsCrossed },
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'Riders', href: '/dashboard/riders', icon: Bike },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    ];

    return (
        <aside className="w-64 bg-slate-900 min-h-screen flex flex-col shadow-xl z-10 relative">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">K</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">KhanaGo</h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wide opacity-80">ADMIN PANEL</p>
                    </div>
                </div>
                <div className="h-px bg-slate-800 w-full mb-2"></div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-orange-600/10 text-orange-500 shadow-[inset_4px_0_0_0_#f97316]'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                }`}
                        >
                            <Icon size={20} className={`transition-colors ${isActive ? 'text-orange-500' : 'group-hover:text-white'}`} />
                            <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-slate-800">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all group"
                >
                    <LogOut size={20} className="group-hover:text-red-500" />
                    <span className="font-medium text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
