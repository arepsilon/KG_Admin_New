
'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

import AddRestaurantModal from './AddRestaurantModal';
import RestaurantMenuModal from './RestaurantMenuModal';
import { Edit2, Upload, MapPin, Phone, DollarSign, Percent, CreditCard, Store, Image as ImageIcon } from 'lucide-react';

interface Restaurant {
    id: string;
    name: string;
    address: string;
    phone_number: string;
    is_active: boolean;
    is_open: boolean;
    commission_percent: number;
    platform_fee_per_order: number;
    transaction_charge_percent: number;
    image_url: string | null;
    created_at: string;
    orders: { count: number }[];
}

export default function RestaurantsTable() {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedRestaurants, setExpandedRestaurants] = useState<Set<string>>(new Set());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedRestaurantForMenu, setSelectedRestaurantForMenu] = useState<any | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchRestaurants();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('admin_restaurants_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'restaurants',
                },
                (payload) => {
                    console.log('Restaurant change detected:', payload);
                    fetchRestaurants();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [filter]);

    const fetchRestaurants = async () => {
        let query = supabase
            .from('restaurants')
            .select(`
    *,
    orders(count)
        `)
            .order('created_at', { ascending: false });

        if (filter === 'active') {
            query = query.eq('is_active', true);
        } else if (filter === 'inactive') {
            query = query.eq('is_active', false);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching restaurants:', error);
        } else {
            setRestaurants(data || []);
        }
        setLoading(false);
    };

    const toggleExpand = (restaurantId: string) => {
        const newExpanded = new Set(expandedRestaurants);
        if (newExpanded.has(restaurantId)) {
            newExpanded.delete(restaurantId);
        } else {
            newExpanded.add(restaurantId);
        }
        setExpandedRestaurants(newExpanded);
    };

    const expandAll = () => {
        setExpandedRestaurants(new Set(restaurants.map(r => r.id)));
    };

    const collapseAll = () => {
        setExpandedRestaurants(new Set());
    };

    const toggleActiveStatus = async (restaurantId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('restaurants')
            .update({ is_active: !currentStatus })
            .eq('id', restaurantId);

        if (error) {
            alert('Error updating restaurant status');
        } else {
            fetchRestaurants();
        }
    };

    const toggleOpenStatus = async (restaurantId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('restaurants')
            .update({ is_open: !currentStatus })
            .eq('id', restaurantId);

        if (error) {
            alert('Error updating open status');
        } else {
            fetchRestaurants();
        }
    };

    const updateGenericField = async (restaurantId: string, field: string, value: any) => {
        // Validation for fees only
        if (['commission_percent', 'platform_fee_per_order', 'transaction_charge_percent'].includes(field)) {
            if (isNaN(value) || value < 0) {
                alert('Please enter a valid positive number');
                return;
            }
        }

        const { error } = await supabase
            .from('restaurants')
            .update({ [field]: value })
            .eq('id', restaurantId);

        if (error) {
            alert(`Error updating ${field} `);
            console.error(error);
        } else {
            fetchRestaurants();
        }
    };

    const [uploadingRestaurantId, setUploadingRestaurantId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadingRestaurantId) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('restaurantId', uploadingRestaurantId);

            const response = await fetch('/api/restaurants/upload-image', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update image');
            }

            alert('Restaurant image updated successfully! 📸');
            fetchRestaurants();

        } catch (error: any) {
            console.error('Error updating image:', error);
            alert('Failed to update image: ' + error.message);
        } finally {
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
            setUploadingRestaurantId(null);
        }
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
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpdate}
            />
            <AddRestaurantModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    fetchRestaurants();
                }}
            />

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-700">Filter by Status</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <span>➕</span> Add Restaurant
                        </button>
                        <button
                            onClick={expandedRestaurants.size === 0 ? expandAll : collapseAll}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            {expandedRestaurants.size === 0 ? '⬇️ Expand All' : '⬆️ Collapse All'}
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['all', 'active', 'inactive'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Restaurants Cards */}
            <div className="space-y-4">
                {restaurants.map((restaurant) => {
                    const isExpanded = expandedRestaurants.has(restaurant.id);
                    const isActive = restaurant.is_active;

                    return (
                        <div
                            key={restaurant.id}
                            className={`rounded-xl shadow-sm border-2 transition-all ${isActive
                                ? 'bg-white border-gray-200'
                                : 'bg-gray-100 border-gray-300 opacity-60'
                                }`}
                        >
                            {/* Restaurant Header - Always Visible */}
                            <div
                                className={`p-6 ${isActive
                                    ? 'cursor-pointer hover:bg-gray-50'
                                    : 'cursor-not-allowed'
                                    }`}
                                onClick={() => isActive && toggleExpand(restaurant.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-3">
                                            <h3 className={`text-xl font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'
                                                }`}>
                                                🍽️ {restaurant.name}
                                            </h3>
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${restaurant.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {restaurant.is_active ? '✓ Active' : '✗ Inactive'}
                                            </span>
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${restaurant.is_open
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {restaurant.is_open ? '🟢 Open' : '🔴 Closed'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm">
                                            <div>
                                                <p className="text-gray-500">Total Orders</p>
                                                <p className={`font-bold text-lg ${isActive ? 'text-gray-900' : 'text-gray-500'
                                                    }`}>
                                                    {restaurant.orders?.[0]?.count || 0}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Rating</p>
                                                <p className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'
                                                    }`}>
                                                    ⭐ {restaurant.rating?.toFixed(1) || '0.0'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {isActive && (
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
                                    )}

                                    {!isActive && (
                                        <div className="ml-4 text-gray-400">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Details - Only for Active Restaurants */}
                            {isExpanded && isActive && (
                                <div className="border-t border-gray-200 p-6 bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* Restaurant Image */}
                                        <div>
                                            {restaurant.image_url ? (
                                                <div className="relative group">
                                                    <img
                                                        src={restaurant.image_url}
                                                        alt={restaurant.name}
                                                        className="w-full h-64 object-cover rounded-lg"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setUploadingRestaurantId(restaurant.id);
                                                            fileInputRef.current?.click();
                                                        }}
                                                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                                                    >
                                                        <span className="text-white font-bold text-lg">✏️ Change Image</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-full h-64 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity relative group"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setUploadingRestaurantId(restaurant.id);
                                                        fileInputRef.current?.click();
                                                    }}
                                                >
                                                    <span className="text-8xl">🍽️</span>
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-20 rounded-lg transition-opacity">
                                                        <span className="text-white font-bold">Upload Image</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Contact & Details */}
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 mb-2">📝 Description</h4>
                                                <p className="text-sm text-gray-600">
                                                    {restaurant.description || 'No description available'}
                                                </p>
                                            </div>

                                            <div>
                                                <h4 className="flex items-center gap-2 font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
                                                    <span className="text-gray-400"><Phone size={16} /></span>
                                                    Contact Info
                                                </h4>
                                                <div className="space-y-3 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-4 h-4 flex items-center justify-center text-gray-400">📞</span>
                                                        <p>{restaurant.phone}</p>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="w-4 h-4 flex items-center justify-center text-gray-400 mt-0.5">📍</span>
                                                        <p className="flex-1">{restaurant.address}</p>
                                                    </div>

                                                    {/* Location Editor */}
                                                    <LocationEditor
                                                        restaurant={restaurant}
                                                        onUpdate={(lat, lng) => {
                                                            updateGenericField(restaurant.id, 'latitude', lat);
                                                            updateGenericField(restaurant.id, 'longitude', lng);
                                                        }}
                                                    />

                                                    <div className="flex gap-4 pt-2">
                                                        <div>
                                                            <p className="text-xs text-gray-400">Delivery Fee</p>
                                                            <p className="font-medium text-gray-900">₹{restaurant.delivery_fee?.toFixed(2) || '0.00'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400">Min Order</p>
                                                            <p className="font-medium text-gray-900">₹{restaurant.minimum_order || 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Platform Charges */}
                                    <div className="mb-8">
                                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="text-gray-400"><CreditCard size={18} /></span>
                                            <span>Platform Charges</span>
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Commission Card */}
                                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="p-1.5 bg-purple-100 text-purple-600 rounded-md"><Percent size={16} /></span>
                                                    <label className="text-sm font-semibold text-gray-700">Commission</label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        max="100"
                                                        defaultValue={restaurant.commission_percent || 15}
                                                        onBlur={(e) => updateGenericField(restaurant.id, 'commission_percent', parseFloat(e.target.value))}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex-1 px-3 py-2 text-lg text-gray-900 font-bold bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                    />
                                                    <span className="text-sm font-medium text-gray-400">%</span>
                                                </div>
                                            </div>

                                            {/* Transaction Card */}
                                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="p-1.5 bg-blue-100 text-blue-600 rounded-md"><CreditCard size={16} /></span>
                                                    <label className="text-sm font-semibold text-gray-700">Tx Charge</label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        max="100"
                                                        defaultValue={restaurant.transaction_charge_percent || 2.5}
                                                        onBlur={(e) => updateGenericField(restaurant.id, 'transaction_charge_percent', parseFloat(e.target.value))}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex-1 px-3 py-2 text-lg text-gray-900 font-bold bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    />
                                                    <span className="text-sm font-medium text-gray-400">%</span>
                                                </div>
                                            </div>

                                            {/* Platform Fee Card */}
                                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="p-1.5 bg-green-100 text-green-600 rounded-md"><Store size={16} /></span>
                                                    <label className="text-sm font-semibold text-gray-700">Platform Fee</label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-medium text-gray-400">₹</span>
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        defaultValue={restaurant.platform_fee_per_order || 5}
                                                        onBlur={(e) => updateGenericField(restaurant.id, 'platform_fee_per_order', parseFloat(e.target.value))}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex-1 px-3 py-2 text-lg text-gray-900 font-bold bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleOpenStatus(restaurant.id, restaurant.is_open);
                                            }}
                                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            {restaurant.is_open ? '🔴 Close Restaurant' : '🟢 Open Restaurant'}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedRestaurantForMenu(restaurant);
                                            }}
                                            className="flex-1 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>📋</span> Manage Menu
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {restaurants.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <p className="text-gray-500 text-lg">No restaurants found</p>
                    </div>
                )}
            </div>

            {selectedRestaurantForMenu && (
                <RestaurantMenuModal
                    isOpen={!!selectedRestaurantForMenu}
                    onClose={() => setSelectedRestaurantForMenu(null)}
                    restaurantId={selectedRestaurantForMenu.id}
                    restaurantName={selectedRestaurantForMenu.name}
                />
            )}
        </div>
    );
}

function LocationEditor({ restaurant, onUpdate }: { restaurant: any, onUpdate: (lat: number, lng: number) => void }) {
    const [lat, setLat] = useState(restaurant.latitude || '');
    const [lng, setLng] = useState(restaurant.longitude || '');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (lat !== (restaurant.latitude || '') || lng !== (restaurant.longitude || '')) {
            setIsDirty(true);
        }
    }, [lat, lng, restaurant]);

    return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h5 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-gray-500" />
                Update Coordinates
            </h5>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Latitude</label>
                    <input
                        type="number"
                        step="any"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                        placeholder="0.0000"
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Longitude</label>
                    <input
                        type="number"
                        step="any"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                        placeholder="0.0000"
                    />
                </div>
            </div>
            <button
                disabled={!isDirty}
                onClick={(e) => {
                    e.stopPropagation();
                    if (lat && lng) {
                        onUpdate(parseFloat(lat), parseFloat(lng));
                        setIsDirty(false);
                        alert('Location updated! 🗺️');
                    } else {
                        alert('Please provide both Latitude and Longitude');
                    }
                }}
                className={`w-full py-2 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${isDirty
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
            >
                {isDirty ? 'Access Saved' : 'Saved'}
            </button>
        </div>
    );
}
