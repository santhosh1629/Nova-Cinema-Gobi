
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { MenuItem } from '../../types';
import { 
    getMenu as getMockMenu, 
    addMenuItem as addMockItem, 
    updateMenuItem as updateMockItem, 
    removeMenuItem as removeMockItem, 
    updateMenuAvailability as updateMockAvailability 
} from '../../services/mockApi';

type FormState = {
    name: string;
    price: number | '';
    imageUrl: string;
    isAvailable: boolean;
    emoji: string;
    description: string;
    isCombo: boolean;
    comboItemIds: string[];
};

const initialFormState: FormState = {
    name: '', price: '', imageUrl: '', isAvailable: true, emoji: '', description: '', isCombo: false, comboItemIds: [],
};

const processAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            resolve(event.target?.result as string);
        };
        reader.onerror = reject;
    });
};

const AddItemCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="flex items-center justify-center">
        <button
            onClick={onClick}
            className="group flex flex-col items-center justify-center w-full h-full min-h-[280px] bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-all duration-300 shadow-lg hover:shadow-indigo-500/20"
        >
            <svg className="w-12 h-12 mb-2 transition-transform group-hover:scale-110 group-hover:rotate-12 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-bold text-lg">Add New Food Item</span>
        </button>
    </div>
);

const OwnerMenuItemCard: React.FC<{ item: MenuItem; onEdit: (item: MenuItem) => void; onDelete: (itemId: string) => void; onToggleAvailability: (item: MenuItem) => void; }> = ({ item, onEdit, onDelete, onToggleAvailability }) => (
     <div className={`bg-gray-800 rounded-2xl shadow-md border border-gray-700 overflow-hidden flex flex-col transition-all duration-300 ${!item.isAvailable ? 'opacity-60' : ''}`}>
        <div className="relative group">
            <img src={item.imageUrl} alt={item.name} className={`w-full h-40 object-cover ${!item.isAvailable ? 'grayscale' : ''}`} />
             <div className="absolute top-2 left-2 flex gap-2">
                 <button 
                    type="button"
                    onClick={() => onToggleAvailability(item)}
                    className={`text-xs font-bold px-3 py-1 rounded-full text-white shadow-md transition-colors ${item.isAvailable ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} backdrop-blur-sm`}
                 >
                    {item.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                </button>
             </div>
        </div>
        <div className="p-4 flex-grow flex flex-col">
            <h3 className="font-bold text-gray-200 flex-grow">{item.emoji} {item.name}</h3>
            <p className="font-bold text-indigo-400 text-lg mt-1">₹{item.price.toFixed(2)}</p>
        </div>
        <div className="bg-gray-700/50 p-2 flex justify-end gap-2">
            <button type="button" onClick={() => onEdit(item)} className="text-sm bg-gray-600 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-gray-500 transition-colors">Edit</button>
            <button type="button" onClick={() => onDelete(item.id)} className="text-sm bg-red-800 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors">Delete</button>
        </div>
    </div>
);


const DailySpecialsPage: React.FC = () => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState<FormState>(initialFormState);
    const { user } = useAuth();
    
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState('');


    const fetchMenu = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('name');
                
            if (error) throw error;
            
            const formattedData = (data || []).map(item => ({
                ...item,
                isCombo: item.is_combo, 
                imageUrl: item.image_url,
                isAvailable: item.is_available,
            })).filter(item => item.category !== 'game');
            
            setMenuItems(formattedData as MenuItem[]);
        } catch (error) { 
            console.warn("Supabase fetch failed (Offline Mode Active):", (error as any).message || error);
            try {
                const mockData = await getMockMenu();
                setMenuItems(mockData.filter(i => i.category !== 'game'));
            } catch (mockErr) {
                console.error("Critical: Failed to load menu from mock.", mockErr);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchMenu();
    }, [fetchMenu]);
    
    const regularMenuItems = useMemo(() => menuItems.filter(item => !item.isCombo), [menuItems]);

    const handleOpenModal = (item: MenuItem | null = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name, price: item.price, imageUrl: item.imageUrl, isAvailable: item.isAvailable,
                emoji: item.emoji || '', description: item.description || '', isCombo: item.isCombo || false,
                comboItemIds: item.comboItems?.map(ci => ci.id) || [],
            });
            setImagePreview(item.imageUrl);
        } else {
            setEditingItem(null);
            setFormData(initialFormState);
            setImagePreview(null);
        }
        setImageError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { 
        setIsModalOpen(false); 
        setEditingItem(null); 
        setFormData(initialFormState);
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        setImageError('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : (name === 'price' ? (value === '' ? '' : parseFloat(value)) : value) }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) { 
            setImageError('File too large (max 10MB)');
            return;
        }
        
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageError('');
        setIsProcessingImage(true);
        
        const newPreviewUrl = URL.createObjectURL(file);
        setImagePreview(newPreviewUrl);

        try {
            const compressedDataUrl = await processAndCompressImage(file);
            setFormData(prev => ({...prev, imageUrl: compressedDataUrl}));
        } catch (err) {
            setImageError('Could not process image.');
            setImagePreview(null);
        } finally {
            setIsProcessingImage(false);
        }
    };


    const handleComboItemChange = (itemId: string) => {
        setFormData(prev => {
            const newComboItemIds = new Set(prev.comboItemIds);
            newComboItemIds.has(itemId) ? newComboItemIds.delete(itemId) : newComboItemIds.add(itemId);
            return { ...prev, comboItemIds: Array.from(newComboItemIds) };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (formData.price === '' || !formData.imageUrl) return;

        const comboItems = formData.isCombo ? formData.comboItemIds.map(id => ({ id, name: regularMenuItems.find(i => i.id === id)?.name || 'Unknown' })) : undefined;
        
        const payload = {
            name: formData.name,
            price: formData.price,
            image_url: formData.imageUrl,
            is_available: formData.isAvailable,
            emoji: formData.emoji,
            description: formData.description,
            is_combo: formData.isCombo,
            combo_items: comboItems,
            category: 'food'
        };

        try {
            if (editingItem) {
                await updateMockItem(editingItem.id, payload);
            } else {
                await addMockItem(payload, user.id);
            }
            
            fetchMenu();
            handleCloseModal();
            window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: `Item ${editingItem ? 'updated' : 'added'} successfully!` } }));

        } catch (error) { 
            console.error("Save failed:", error);
            const msg = (error as any).message || JSON.stringify(error);
            window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: `Save Failed: ${msg}` } }));
        }
    };
    
    const handleDeleteMenuItem = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this item? This cannot be undone.")) {
            return;
        }

        try {
            await removeMockItem(id);
            setMenuItems(prev => prev.filter(item => item.id !== id));
            window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: 'Item deleted successfully.' } }));
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete item: " + ((error as any).message || "Unknown error"));
        }
    };
    
    const handleToggleAvailability = async (item: MenuItem) => {
        const newStatus = !item.isAvailable;
        setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, isAvailable: newStatus } : i));

        try {
            await updateMockAvailability(item.id, newStatus);
        } catch (error) {
            console.error("Toggle failed:", error);
            setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, isAvailable: !newStatus } : i));
        }
    };
    
    if (loading) return <p className="text-gray-300 text-center py-10">Loading menu...</p>;

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-gray-200">Manage Menu 📋</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <AddItemCard onClick={() => handleOpenModal()} />
                {menuItems.map(item => (
                    <OwnerMenuItemCard 
                        key={item.id} 
                        item={item}
                        onEdit={handleOpenModal}
                        onDelete={handleDeleteMenuItem}
                        onToggleAvailability={handleToggleAvailability}
                    />
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl w-full max-w-lg animate-fade-in-down max-h-[90vh] overflow-y-auto scrollbar-thin">
                        <h2 className="text-2xl font-bold mb-6 text-white">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4 text-gray-300">
                            <InputField label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
                            <InputField label="Emoji" name="emoji" value={formData.emoji} placeholder="e.g., 🍔" onChange={handleInputChange} />
                            <InputField label="Price (₹)" name="price" type="number" value={formData.price} onChange={handleInputChange} required step="0.01" min="0" />
                            
                             <div>
                                <label className="block text-gray-300 font-semibold mb-2">Item Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 flex-shrink-0 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden border border-gray-600">
                                        {isProcessingImage ? (
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                                        ) : imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-500 text-xs text-center">No Image</span>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <input id="image-upload" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700" />
                                        {imageError && <p className="text-red-400 text-xs mt-1">{imageError}</p>}
                                    </div>
                                </div>
                            </div>

                            <CheckboxField label="Item is available for ordering" name="isAvailable" checked={formData.isAvailable} onChange={handleInputChange} />
                            <CheckboxField label="This is a Combo Deal" name="isCombo" checked={formData.isCombo} onChange={handleInputChange} />
                            
                            {formData.isCombo && (
                                <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 space-y-4">
                                    <TextAreaField label="Combo Description" name="description" value={formData.description} onChange={handleInputChange} />
                                    <div>
                                        <label className="block font-semibold mb-2">Select Items for Combo</label>
                                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded-lg bg-gray-800 border-gray-600">
                                            {regularMenuItems.map(item => (
                                                <label key={item.id} className="flex items-center p-2 rounded-md hover:bg-gray-700">
                                                    <input type="checkbox" checked={formData.comboItemIds.includes(item.id)} onChange={() => handleComboItemChange(item.id)} className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-500"/>
                                                    <span className="ml-2 text-sm">{item.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                                <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">{editingItem ? 'Save Changes' : 'Add Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
const InputField: React.FC<any> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-gray-300 font-semibold mb-2">{label}</label>
        <input id={props.name} {...props} className="w-full px-4 py-2 border border-gray-600 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
    </div>
);
const TextAreaField: React.FC<any> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-gray-300 font-semibold mb-2">{label}</label>
        <textarea id={props.name} rows={2} {...props} className="w-full px-4 py-2 border border-gray-600 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
    </div>
);
const CheckboxField: React.FC<any> = ({ label, ...props }) => (
    <label className="flex items-center">
        <input type="checkbox" {...props} className="form-checkbox h-5 w-5 bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-500 rounded"/>
        <span className="ml-3 font-medium">{label}</span>
    </label>
);

export default DailySpecialsPage;
