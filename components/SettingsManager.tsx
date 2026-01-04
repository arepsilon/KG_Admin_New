'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Settings, Save, AlertCircle, Truck, Banknote, Bell } from 'lucide-react';

export default function SettingsManager() {
    const supabase = createClient();
    const [groceryEnabled, setGroceryEnabled] = useState(false);
    const [baseDeliveryFee, setBaseDeliveryFee] = useState('30');
    const [perKmFee, setPerKmFee] = useState('10');
    const [customerPlatformFee, setCustomerPlatformFee] = useState('5');
    const [alertsEnabled, setAlertsEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('key, value');

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching settings:', error);
            }

            if (data) {
                data.forEach((setting: any) => {
                    switch (setting.key) {
                        case 'enable_grocery':
                            setGroceryEnabled(setting.value === true || setting.value === 'true');
                            break;
                        case 'base_delivery_fee':
                            setBaseDeliveryFee(String(setting.value || 30));
                            break;
                        case 'per_km_fee':
                            setPerKmFee(String(setting.value || 10));
                            break;
                        case 'customer_platform_fee':
                        case 'platform_fee':
                            setCustomerPlatformFee(String(setting.value || 5));
                            break;
                        case 'realtime_alerts_enabled':
                            setAlertsEnabled(setting.value === true || setting.value === 'true');
                            break;
                    }
                });
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSetting = async (key: string, value: any, description: string) => {
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('app_settings')
                .upsert({ key, value, description });

            if (error) throw error;
            setMessage({ type: 'success', text: `${description} updated successfully.` });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleGroceryToggle = () => {
        const newValue = !groceryEnabled;
        setGroceryEnabled(newValue);
        saveSetting('enable_grocery', newValue, 'Grocery feature');
    };

    const handleAlertsToggle = () => {
        const newValue = !alertsEnabled;
        setAlertsEnabled(newValue);
        saveSetting('realtime_alerts_enabled', newValue, 'Real-time alerts');
    };

    const handleSaveDeliveryFees = () => {
        saveSetting('base_delivery_fee', parseFloat(baseDeliveryFee) || 30, 'Base delivery fee');
        saveSetting('per_km_fee', parseFloat(perKmFee) || 10, 'Per-km delivery fee');
    };

    const handleSaveCustomerFee = () => {
        saveSetting('customer_platform_fee', parseFloat(customerPlatformFee) || 5, 'Customer platform fee');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Settings className="text-blue-500 w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">App Configurations</h2>
                    <p className="text-sm text-slate-500">Manage global application features and settings</p>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <AlertCircle size={20} />
                    <p className="font-medium">{message.text}</p>
                </div>
            )}

            <div className="space-y-6">
                {/* Grocery Toggle */}
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-2xl">🥦</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">Grocery & Vegetables</h3>
                            <p className="text-sm text-slate-500 max-w-md">Enable grocery delivery options.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={groceryEnabled} onChange={handleGroceryToggle} disabled={saving} />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                        <span className="ml-3 text-sm font-medium text-slate-900">{groceryEnabled ? 'Active' : 'Inactive'}</span>
                    </label>
                </div>

                {/* Real-time Alerts Toggle */}
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Bell className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">Real-time Order Alerts</h3>
                            <p className="text-sm text-slate-500 max-w-md">Toast notifications when new orders arrive.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={alertsEnabled} onChange={handleAlertsToggle} disabled={saving} />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-500"></div>
                        <span className="ml-3 text-sm font-medium text-slate-900">{alertsEnabled ? 'Active' : 'Inactive'}</span>
                    </label>
                </div>

                {/* Distance-Based Delivery Fee */}
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex gap-4 mb-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Truck className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">Delivery Fee (Distance-Based)</h3>
                            <p className="text-sm text-slate-500">Base fee for first 2 km + per-km charge after.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Base Fee (First 2 km)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">₹</span>
                                <input type="number" value={baseDeliveryFee} onChange={(e) => setBaseDeliveryFee(e.target.value)} className="pl-8 pr-4 py-2 border border-slate-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500" min="0" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Per KM (After 2 km)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">₹</span>
                                <input type="number" value={perKmFee} onChange={(e) => setPerKmFee(e.target.value)} className="pl-8 pr-4 py-2 border border-slate-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500" min="0" />
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">/km</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSaveDeliveryFees} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
                        <Save size={16} /> Save Delivery Fees
                    </button>
                </div>

                {/* Customer Platform Fee */}
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex gap-4 mb-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Banknote className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">Customer Platform Fee</h3>
                            <p className="text-sm text-slate-500">Fixed fee charged to customers per order. Restaurant fees are configured per-restaurant.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">₹</span>
                            <input type="number" value={customerPlatformFee} onChange={(e) => setCustomerPlatformFee(e.target.value)} className="pl-8 pr-4 py-2 border border-slate-200 rounded-lg w-32 focus:ring-2 focus:ring-green-500" min="0" />
                        </div>
                        <button onClick={handleSaveCustomerFee} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                            <Save size={16} /> Save
                        </button>
                    </div>
                </div>

                {/* Info Note */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-sm text-amber-700">
                        <strong>Note:</strong> Restaurant Commission % and Transaction Charges are configured per-restaurant in the Restaurants tab.
                    </p>
                </div>
            </div>
        </div>
    );
}
