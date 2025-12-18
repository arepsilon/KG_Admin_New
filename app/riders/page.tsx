'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RidersPage() {
    const [riders, setRiders] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ full_name: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [createdRider, setCreatedRider] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchRiders();
    }, []);

    const fetchRiders = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'rider')
            .order('created_at', { ascending: false });
        setRiders(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setCreatedRider(null);

        try {
            const res = await fetch('/api/riders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                setCreatedRider(data.rider);
                setFormData({ full_name: '', phone: '' });
                fetchRiders(); // Refresh list
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error: any) {
            alert('Error creating rider: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Riders</h1>
                        <p className="text-gray-600">Manage delivery riders</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 flex items-center gap-2"
                    >
                        <span>+</span> Add Rider
                    </button>
                </div>

                {/* Riders Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {riders.map((rider) => (
                                <tr key={rider.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{rider.full_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {rider.email || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {rider.phone || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {riders.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No riders yet. Click "+ Add Rider" to create one.
                        </div>
                    )}
                </div>

                {/* Add Rider Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Add New Rider</h2>
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setCreatedRider(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Success Message with Credentials */}
                            {createdRider && (
                                <div className="mb-6 p-6 bg-green-50 border-2 border-green-500 rounded-lg">
                                    <h3 className="text-xl font-bold text-green-800 mb-4">✓ Rider Created Successfully!</h3>
                                    <div className="space-y-2 font-mono text-sm bg-white p-4 rounded border border-green-200">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Name:</span>
                                            <span className="font-bold">{createdRider.full_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Rider ID:</span>
                                            <span className="font-bold">{createdRider.riderId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Email:</span>
                                            <span className="font-bold">{createdRider.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Password:</span>
                                            <span className="font-bold text-red-600">{createdRider.password}</span>
                                        </div>
                                        {createdRider.phone && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Phone:</span>
                                                <span className="font-bold">{createdRider.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
                                        <p className="text-sm text-yellow-800">
                                            ⚠️ <strong>Important:</strong> Save these credentials now! The password won't be shown again.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setCreatedRider(null);
                                        }}
                                        className="mt-4 w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}

                            {/* Add Rider Form */}
                            {!createdRider && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                                            placeholder="Enter rider name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Phone Number (Optional)
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                                            placeholder="Enter phone number"
                                        />
                                    </div>

                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <strong>Auto-Generation:</strong>
                                        </p>
                                        <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                                            <li>Unique Rider ID (email) will be generated</li>
                                            <li>Secure random password will be created</li>
                                            <li>Credentials shown only once after creation</li>
                                        </ul>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50"
                                        >
                                            {loading ? 'Creating...' : 'Create Rider'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
