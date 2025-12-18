'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function OrdersTable() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const supabase = createClient();

    useEffect(() => {
        fetchOrders();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('orders_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                },
                () => {
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [filter]);

    const fetchOrders = async () => {
        let query = supabase
            .from('orders')
            .select(`
                *,
                restaurant:restaurants(name),
                customer:profiles!customer_id(full_name, phone),
                address:addresses(address_line1, city, label),
                order_items(
                    *,
                    menu_item:menu_items(name, price)
                )
            `)
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('status', filter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data || []);
        }
        setLoading(false);
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) {
            alert('Error updating order status');
        } else {
            fetchOrders();
        }
    };

    const toggleExpand = (orderId: string) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    const expandAll = () => {
        setExpandedOrders(new Set(orders.map(o => o.id)));
    };

    const collapseAll = () => {
        setExpandedOrders(new Set());
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            accepted: 'bg-blue-100 text-blue-800 border-blue-200',
            preparing: 'bg-purple-100 text-purple-800 border-purple-200',
            ready: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            assigned: 'bg-cyan-100 text-cyan-800 border-cyan-200',
            picked_up: 'bg-teal-100 text-teal-800 border-teal-200',
            on_the_way: 'bg-orange-100 text-orange-800 border-orange-200',
            delivered: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
            rejected: 'bg-red-100 text-red-800 border-red-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-700">Filter by Status</h3>
                    <button
                        onClick={expandedOrders.size === 0 ? expandAll : collapseAll}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        {expandedOrders.size === 0 ? '⬇️ Expand All' : '⬆️ Collapse All'}
                    </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'accepted', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status.replace('_', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Cards */}
            <div className="space-y-4">
                {orders.map((order) => {
                    const isExpanded = expandedOrders.has(order.id);
                    return (
                        <div key={order.id} className={`bg-white rounded-xl shadow-sm border-2 ${getStatusColor(order.status)} transition-all`}>
                            {/* Order Header - Always Visible */}
                            <div
                                className="p-6 cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleExpand(order.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-3">
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {order.order_number}
                                            </h3>
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Customer</p>
                                                <p className="font-medium text-gray-900">{order.customer?.full_name || 'Unknown'}</p>
                                                <p className="text-gray-600 text-xs">{order.customer?.phone}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Restaurant</p>
                                                <p className="font-medium text-gray-900">{order.restaurant?.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Total Amount</p>
                                                <p className="font-bold text-lg text-orange-600">₹{order.total.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="ml-4 text-gray-400 hover:text-gray-600">
                                        <svg
                                            className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 p-6 bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* Delivery Address */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">📍 Delivery Address</h4>
                                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                <p className="font-medium text-gray-900">{order.address?.label}</p>
                                                <p className="text-sm text-gray-600">{order.address?.address_line1}</p>
                                            </div>
                                        </div>

                                        {/* Order Details */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">📅 Order Details</h4>
                                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                <p className="text-sm text-gray-600">
                                                    Placed: {new Date(order.created_at).toLocaleString()}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Payment: {order.payment_method.toUpperCase()} - {order.payment_status.toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-gray-900 mb-3">🍽️ Order Items ({order.order_items?.length || 0})</h4>
                                        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                                            {order.order_items?.map((item: any, index: number) => (
                                                <div key={index} className="p-4 flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{item.menu_item?.name}</p>
                                                        <p className="text-sm text-gray-600">
                                                            Quantity: {item.quantity} × ₹{item.unit_price.toFixed(2)}
                                                        </p>
                                                        {item.special_instructions && (
                                                            <p className="text-xs text-gray-500 mt-1">Note: {item.special_instructions}</p>
                                                        )}
                                                    </div>
                                                    <p className="font-semibold text-gray-900">
                                                        ₹{item.subtotal.toFixed(2)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bill Breakdown */}
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-gray-900 mb-3">💰 Bill Details</h4>
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            <div className="flex justify-between py-2">
                                                <span className="text-gray-600">Subtotal</span>
                                                <span className="font-medium">₹{order.subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between py-2">
                                                <span className="text-gray-600">Delivery Fee</span>
                                                <span className="font-medium">₹{order.delivery_fee.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between py-2">
                                                <span className="text-gray-600">Tax</span>
                                                <span className="font-medium">₹{order.tax.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between py-3 border-t border-gray-200 mt-2">
                                                <span className="font-bold text-gray-900">Total</span>
                                                <span className="font-bold text-xl text-orange-600">₹{order.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Update */}
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">⚡ Update Status</h4>
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="accepted">Accepted</option>
                                            <option value="preparing">Preparing</option>
                                            <option value="ready">Ready</option>
                                            <option value="assigned">Assigned to Rider</option>
                                            <option value="picked_up">Picked Up</option>
                                            <option value="on_the_way">On the Way</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {orders.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <p className="text-gray-500 text-lg">No orders found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
