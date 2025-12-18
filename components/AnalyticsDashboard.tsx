'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AnalyticsDashboard() {
    const [analytics, setAnalytics] = useState<any>({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        totalCustomers: 0,
        revenueByDay: [],
        ordersByStatus: [],
        topRestaurants: []
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // Fetch all orders
            const { data: orders } = await supabase
                .from('orders')
                .select('*, restaurant:restaurants(name)');

            // Fetch customers count
            const { count: customersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'customer');

            if (orders) {
                // Calculate total revenue and avg order value
                const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
                const totalOrders = orders.length;
                const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                // Group orders by status
                const ordersByStatus = orders.reduce((acc: any, order) => {
                    const status = order.status;
                    if (!acc[status]) {
                        acc[status] = 0;
                    }
                    acc[status]++;
                    return acc;
                }, {});

                // Calculate revenue by restaurant
                const restaurantRevenue = orders.reduce((acc: any, order) => {
                    const restaurantName = order.restaurant?.name || 'Unknown';
                    if (!acc[restaurantName]) {
                        acc[restaurantName] = { name: restaurantName, revenue: 0, orders: 0 };
                    }
                    acc[restaurantName].revenue += order.total || 0;
                    acc[restaurantName].orders += 1;
                    return acc;
                }, {});

                const topRestaurants = Object.values(restaurantRevenue)
                    .sort((a: any, b: any) => b.revenue - a.revenue)
                    .slice(0, 5);

                setAnalytics({
                    totalRevenue,
                    totalOrders,
                    avgOrderValue,
                    totalCustomers: customersCount || 0,
                    ordersByStatus: Object.entries(ordersByStatus).map(([status, count]) => ({
                        status,
                        count
                    })),
                    topRestaurants
                });
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-600 mb-2">Total Revenue</p>
                    <p className="text-3xl font-bold text-emerald-600">₹{analytics.totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 mt-2">All time earnings</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-600 mb-2">Total Orders</p>
                    <p className="text-3xl font-bold text-slate-900">{analytics.totalOrders}</p>
                    <p className="text-xs text-slate-500 mt-2">Orders placed</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-600 mb-2">Avg Order Value</p>
                    <p className="text-3xl font-bold text-slate-900">₹{analytics.avgOrderValue.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 mt-2">Per order average</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-600 mb-2">Total Customers</p>
                    <p className="text-3xl font-bold text-slate-900">{analytics.totalCustomers}</p>
                    <p className="text-xs text-slate-500 mt-2">Registered users</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders by Status */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Orders by Status</h3>
                    <div className="space-y-4">
                        {analytics.ordersByStatus.map((item: any, index: number) => {
                            const percentage = (item.count / analytics.totalOrders) * 100;
                            const colors = [
                                'bg-amber-500',
                                'bg-blue-500',
                                'bg-indigo-500',
                                'bg-emerald-500',
                                'bg-rose-500'
                            ];
                            const color = colors[index % colors.length];

                            return (
                                <div key={item.status}>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium text-slate-700 capitalize">
                                            {item.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-sm font-bold text-slate-900">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div
                                            className={`${color} h-2.5 rounded-full transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Restaurants */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Top Restaurants by Revenue</h3>
                    <div className="space-y-3">
                        {analytics.topRestaurants.map((restaurant: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{restaurant.name}</p>
                                        <p className="text-xs text-slate-500">{restaurant.orders} orders</p>
                                    </div>
                                </div>
                                <p className="font-bold text-emerald-600">₹{restaurant.revenue.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Platform Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-600 mb-2">Successful Orders</p>
                        <p className="text-3xl font-bold text-emerald-600">
                            {analytics.ordersByStatus.find((s: any) => s.status === 'delivered')?.count || 0}
                        </p>
                    </div>
                    <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-600 mb-2">Pending Orders</p>
                        <p className="text-3xl font-bold text-amber-600">
                            {analytics.ordersByStatus.find((s: any) => s.status === 'pending')?.count || 0}
                        </p>
                    </div>
                    <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-600 mb-2">Cancelled Orders</p>
                        <p className="text-3xl font-bold text-rose-600">
                            {analytics.ordersByStatus.find((s: any) => s.status === 'cancelled')?.count || 0}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
