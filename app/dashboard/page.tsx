import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DashboardStats from '@/components/DashboardStats';
import RecentOrders from '@/components/RecentOrders';

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch dashboard data
    const [ordersResult, customersResult, restaurantsResult] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
    ]);

    // Get total revenue from delivered orders
    const { data: revenueData } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'delivered');

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    const stats = {
        totalOrders: ordersResult.count || 0,
        totalRevenue,
        totalCustomers: customersResult.count || 0,
        totalRestaurants: restaurantsResult.count || 0,
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
                    <DashboardStats stats={stats} />
                    <RecentOrders />
                </div>
            </main>
        </div>
    );
}
