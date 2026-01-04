'use client';

import Link from 'next/link';
import Image from 'next/image';
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
    LogOut,
    Rocket,
    Megaphone,
    Settings,
    Carrot,
    List,
    Layers,
    Tag
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
        { name: 'Categories', href: '/dashboard/categories', icon: Layers },
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'Riders', href: '/dashboard/riders', icon: Bike },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
        { name: 'Grocery', href: '/dashboard/grocery', icon: Carrot },
        { name: 'Promos', href: '/dashboard/ads', icon: Megaphone },
        { name: 'Coupons', href: '/dashboard/coupons', icon: Tag },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <aside className="w-72 bg-white min-h-screen flex flex-col border-r border-slate-100 sticky top-0 h-screen">
            <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-orange-200 shadow-lg">
                        <Image
                            src="/khanago_logo.jpg"
                            alt="KhanaGo Logo"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">KhanaGo</h1>
                        <p className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">Admin Panel</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-6 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group font-medium text-sm ${isActive
                                ? 'bg-orange-500 text-white shadow-orange-200 shadow-md'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <Icon size={22} className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 mt-auto">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group font-medium text-sm border border-transparent hover:border-red-100"
                >
                    <LogOut size={20} className="group-hover:text-red-600 transition-colors" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
