'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Download, Share2, Building2, Loader2, Printer } from 'lucide-react';

type Restaurant = {
    id: string;
    name: string;
    commission_percent: number;
    phone?: string;
};

type OrderItem = {
    id: string;
    quantity: number;
    unit_price: number;
    menu_item: { name: string }[];
};

type Order = {
    id: string;
    order_number: string;
    created_at: string;
    subtotal: number;
    status: string;
    order_items: OrderItem[];
};

type FeeSettings = {
    platform_fee: number;
    transaction_fee_percent: number;
};

export default function PaymentReports() {
    const supabase = createClient();

    // State
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingRestaurants, setLoadingRestaurants] = useState(true);
    const [feeSettings, setFeeSettings] = useState<FeeSettings>({ platform_fee: 5, transaction_fee_percent: 2 });
    const [reportGenerated, setReportGenerated] = useState(false);

    // Get restaurant details
    const restaurantDetails = restaurants.find(r => r.id === selectedRestaurant);

    useEffect(() => {
        loadRestaurants();
        loadFeeSettings();
        // Set default dates (current month)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, []);

    const loadRestaurants = async () => {
        const { data } = await supabase
            .from('restaurants')
            .select('id, name, commission_percent, phone')
            .order('name');
        if (data) setRestaurants(data);
        setLoadingRestaurants(false);
    };

    const loadFeeSettings = async () => {
        const { data } = await supabase
            .from('fee_settings')
            .select('*')
            .single();
        if (data) {
            setFeeSettings({
                platform_fee: data.platform_fee || 5,
                transaction_fee_percent: data.transaction_fee_percent || 2
            });
        }
    };

    const generateReport = async () => {
        if (!selectedRestaurant || !startDate || !endDate) return;

        setLoading(true);
        setReportGenerated(false);

        const { data, error } = await supabase
            .from('orders')
            .select(`
                id, order_number, created_at, subtotal, status,
                order_items(id, quantity, unit_price, menu_item:menu_items(name))
            `)
            .eq('restaurant_id', selectedRestaurant)
            .eq('status', 'delivered')
            .gte('created_at', startDate)
            .lte('created_at', endDate + 'T23:59:59')
            .order('created_at', { ascending: false });

        if (data) {
            setOrders(data);
            setReportGenerated(true);
        }
        setLoading(false);
    };

    // Calculations
    const calculateOrderDeductions = (order: Order) => {
        const subtotal = order.subtotal || 0;
        const commissionPercent = restaurantDetails?.commission_percent || 0;
        const commission = subtotal * (commissionPercent / 100);
        const platformFee = feeSettings.platform_fee;
        const transactionFee = subtotal * (feeSettings.transaction_fee_percent / 100);
        const totalDeductions = commission + platformFee + transactionFee;
        const netPayable = subtotal - totalDeductions;
        return { commission, platformFee, transactionFee, totalDeductions, netPayable };
    };

    const totals = orders.reduce((acc, order) => {
        const deductions = calculateOrderDeductions(order);
        return {
            grossRevenue: acc.grossRevenue + order.subtotal,
            totalCommission: acc.totalCommission + deductions.commission,
            totalPlatformFee: acc.totalPlatformFee + deductions.platformFee,
            totalTransactionFee: acc.totalTransactionFee + deductions.transactionFee,
            totalDeductions: acc.totalDeductions + deductions.totalDeductions,
            netPayable: acc.netPayable + deductions.netPayable,
        };
    }, { grossRevenue: 0, totalCommission: 0, totalPlatformFee: 0, totalTransactionFee: 0, totalDeductions: 0, netPayable: 0 });

    const handlePrint = () => {
        window.print();
    };

    const handleShareWhatsApp = () => {
        if (!restaurantDetails) return;

        const message = `*Payment Report - ${restaurantDetails.name}*
        
📅 Period: ${formatDate(startDate)} to ${formatDate(endDate)}
📦 Total Orders: ${orders.length}

💰 *Summary*
Gross Revenue: ₹${totals.grossRevenue.toFixed(2)}
Commission (${restaurantDetails.commission_percent}%): -₹${totals.totalCommission.toFixed(2)}
Platform Fee: -₹${totals.totalPlatformFee.toFixed(2)}
Transaction Fee: -₹${totals.totalTransactionFee.toFixed(2)}
—————————————
*Net Payable: ₹${totals.netPayable.toFixed(2)}*

Please confirm receipt of this report.`;

        const phone = restaurantDetails.phone?.replace(/\D/g, '') || '';
        const waLink = `https://wa.me/${phone ? '91' + phone : ''}?text=${encodeURIComponent(message)}`;
        window.open(waLink, '_blank');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Generate Payment Report</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Restaurant Selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Restaurant</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={selectedRestaurant}
                                onChange={(e) => setSelectedRestaurant(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                disabled={loadingRestaurants}
                            >
                                <option value="">Select Restaurant</option>
                                {restaurants.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Start Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">End Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="flex items-end">
                        <button
                            onClick={generateReport}
                            disabled={!selectedRestaurant || loading}
                            className="w-full bg-orange-500 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Preview (Printable Area) */}
            {reportGenerated && (
                <div id="print-area" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Report Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 print:bg-orange-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold">Payment Report</h1>
                                <p className="text-orange-100 mt-1">{restaurantDetails?.name}</p>
                            </div>
                            <div className="text-right text-sm">
                                <p className="font-semibold">Period</p>
                                <p className="text-orange-100">{formatDate(startDate)} - {formatDate(endDate)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 print:bg-white">
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-500">Total Orders</p>
                            <p className="text-2xl font-bold text-slate-800">{orders.length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-500">Gross Revenue</p>
                            <p className="text-2xl font-bold text-slate-800">₹{totals.grossRevenue.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-500">Total Deductions</p>
                            <p className="text-2xl font-bold text-red-500">-₹{totals.totalDeductions.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-green-200 bg-green-50">
                            <p className="text-sm text-green-600">Net Payable</p>
                            <p className="text-2xl font-bold text-green-600">₹{totals.netPayable.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="text-left p-3 font-semibold text-slate-600">Order #</th>
                                    <th className="text-left p-3 font-semibold text-slate-600">Date</th>
                                    <th className="text-left p-3 font-semibold text-slate-600">Items</th>
                                    <th className="text-right p-3 font-semibold text-slate-600">Subtotal</th>
                                    <th className="text-right p-3 font-semibold text-slate-600">Commission</th>
                                    <th className="text-right p-3 font-semibold text-slate-600">Fees</th>
                                    <th className="text-right p-3 font-semibold text-slate-600">Net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const deductions = calculateOrderDeductions(order);
                                    return (
                                        <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="p-3 font-medium text-slate-800">#{order.order_number}</td>
                                            <td className="p-3 text-slate-600">{formatDate(order.created_at)}</td>
                                            <td className="p-3 text-slate-600">
                                                <ul className="text-xs space-y-0.5">
                                                    {order.order_items?.map((item) => (
                                                        <li key={item.id}>
                                                            {item.quantity}x {item.menu_item?.[0]?.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="p-3 text-right font-medium">₹{order.subtotal.toFixed(2)}</td>
                                            <td className="p-3 text-right text-red-500">-₹{deductions.commission.toFixed(2)}</td>
                                            <td className="p-3 text-right text-red-500">-₹{(deductions.platformFee + deductions.transactionFee).toFixed(2)}</td>
                                            <td className="p-3 text-right font-semibold text-green-600">₹{deductions.netPayable.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-100 font-semibold">
                                <tr>
                                    <td colSpan={3} className="p-3">Total</td>
                                    <td className="p-3 text-right">₹{totals.grossRevenue.toFixed(2)}</td>
                                    <td className="p-3 text-right text-red-500">-₹{totals.totalCommission.toFixed(2)}</td>
                                    <td className="p-3 text-right text-red-500">-₹{(totals.totalPlatformFee + totals.totalTransactionFee).toFixed(2)}</td>
                                    <td className="p-3 text-right text-green-600">₹{totals.netPayable.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Deduction Breakdown */}
                    <div className="p-6 bg-slate-50 border-t border-slate-200">
                        <h3 className="font-semibold text-slate-700 mb-3">Deduction Breakdown</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Commission ({restaurantDetails?.commission_percent}%)</span>
                                <span className="font-medium text-red-500">-₹{totals.totalCommission.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Platform Fee (₹{feeSettings.platform_fee}/order)</span>
                                <span className="font-medium text-red-500">-₹{totals.totalPlatformFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Transaction Fee ({feeSettings.transaction_fee_percent}%)</span>
                                <span className="font-medium text-red-500">-₹{totals.totalTransactionFee.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons (Hidden in Print) */}
                    <div className="p-6 flex gap-4 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="flex-1 bg-slate-800 text-white py-3 px-4 rounded-lg font-semibold hover:bg-slate-900 flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Print / Save PDF
                        </button>
                        <button
                            onClick={handleShareWhatsApp}
                            className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
                        >
                            <Share2 className="w-4 h-4" />
                            Share on WhatsApp
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {reportGenerated && orders.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Download className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Orders Found</h3>
                    <p className="text-slate-500">No delivered orders found for this restaurant in the selected date range.</p>
                </div>
            )}

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-area, #print-area * {
                        visibility: visible;
                    }
                    #print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
