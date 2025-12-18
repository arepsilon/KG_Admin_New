'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface RestaurantMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurantId: string;
    restaurantName: string;
}

export default function RestaurantMenuModal({ isOpen, onClose, restaurantId, restaurantName }: RestaurantMenuModalProps) {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category_id: '',
        is_vegetarian: false,
        is_vegan: false,
        preparation_time: '15'
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const supabase = createClient();

    useEffect(() => {
        if (isOpen && restaurantId) {
            fetchMenuData();
        }
    }, [isOpen, restaurantId]);

    const fetchMenuData = async () => {
        setLoading(true);

        // Fetch Categories
        const { data: catData } = await supabase.from('categories').select('*').order('name');
        setCategories(catData || []);

        // Fetch Items
        const { data: itemData } = await supabase
            .from('menu_items')
            .select('*, categories(name)')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false });

        setItems(itemData || []);
        setLoading(false);
    };

    const handleImageUpload = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `menu-items/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('menu_items') // Ensure this bucket exists!
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('menu_items').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Image upload failed:', error);
            alert('Failed to upload image. Please ensure "menu_items" bucket exists and is public.');
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await handleImageUpload(imageFile);
                if (!imageUrl) throw new Error('Image upload failed');
            }

            const { error } = await supabase.from('menu_items').insert({
                restaurant_id: restaurantId,
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                category_id: formData.category_id || null, // Handle optional category
                is_vegetarian: formData.is_vegetarian,
                is_vegan: formData.is_vegan,
                preparation_time: parseInt(formData.preparation_time),
                image_url: imageUrl,
                is_available: true
            });

            if (error) throw error;

            alert('Menu Item Added! 🍔');
            setFormData({
                name: '',
                description: '',
                price: '',
                category_id: '',
                is_vegetarian: false,
                is_vegan: false,
                preparation_time: '15'
            });
            setImageFile(null);
            setActiveTab('list');
            fetchMenuData(); // Refresh list

        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        const { error } = await supabase.from('menu_items').delete().eq('id', id);
        if (error) alert('Failed to delete item');
        else fetchMenuData();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] shadow-xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-black">Menu: {restaurantName}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-black text-3xl">&times;</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'list'
                                ? 'border-b-2 border-orange-500 text-orange-600 bg-orange-50'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        📋 Menu Items ({items.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('add')}
                        className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'add'
                                ? 'border-b-2 border-orange-500 text-orange-600 bg-orange-50'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        ➕ Add New Item
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loading && activeTab === 'list' && items.length === 0 ? (
                        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>
                    ) : activeTab === 'list' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {items.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4">
                                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">🥘</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg text-black">{item.name}</h3>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-400 hover:text-red-600 font-bold px-2"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                                        <div className="flex justify-between items-center mt-auto">
                                            <span className="font-bold text-orange-600">₹{item.price}</span>
                                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-black">
                                                {item.categories?.name || 'Uncategorized'}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                            {item.is_vegetarian && <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded border border-green-200">VEG</span>}
                                            {item.is_vegan && <span className="text-[10px] bg-green-50 text-green-800 px-2 py-0.5 rounded border border-green-200">VEGAN</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {items.length === 0 && (
                                <div className="col-span-2 text-center py-12 text-gray-500">
                                    No items yet. Switch to "Add New Item" to create one!
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Image Upload */}
                                <div className="flex justify-center mb-6">
                                    <div className="text-center">
                                        <label className="block w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-500 cursor-pointer flex flex-col items-center justify-center transition-colors bg-gray-50">
                                            {imageFile ? (
                                                <span className="text-sm text-green-600 font-semibold p-2 text-center">{imageFile.name}</span>
                                            ) : (
                                                <>
                                                    <span className="text-4xl mb-2">📸</span>
                                                    <span className="text-xs text-gray-500">Upload Photo</span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={e => e.target.files && setImageFile(e.target.files[0])}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-black mb-1">Item Name</label>
                                        <input
                                            required
                                            className="w-full p-2 border rounded-lg text-black focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Butter Chicken"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-black mb-1">Description</label>
                                        <textarea
                                            className="w-full p-2 border rounded-lg text-black focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                            rows={2}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Describe the dish..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">Price (₹)</label>
                                        <input
                                            required type="number" step="0.01"
                                            className="w-full p-2 border rounded-lg text-black focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">Category</label>
                                        <select
                                            className="w-full p-2 border rounded-lg text-black focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                            value={formData.category_id}
                                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                                            checked={formData.is_vegetarian}
                                            onChange={e => setFormData({ ...formData, is_vegetarian: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-black">Vegetarian</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                                            checked={formData.is_vegan}
                                            onChange={e => setFormData({ ...formData, is_vegan: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-black">Vegan</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl shadow-md hover:bg-orange-700 transition-colors disabled:opacity-50 mt-4"
                                >
                                    {loading ? 'Adding Item...' : 'Add Menu Item'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
