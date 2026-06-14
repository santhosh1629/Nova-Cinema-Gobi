import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { MenuItem, CombinedGroup, Order } from '../../types';
import { 
    getMenu as getMockMenu, 
    addMenuItem as addMockItem, 
    updateMenuItem as updateMockItem, 
    removeMenuItem as removeMockItem, 
    updateMenuAvailability as updateMockAvailability,
    getCombinedGroups,
    createCombinedGroup,
    updateCombinedGroup,
    deleteCombinedGroup,
    getOwnerOrders
} from '../../services/mockApi';

type FormState = {
    name: string;
    price: number | '';
    imageUrl: string;
    isAvailable: boolean;
    emoji: string;
    description: string;
    slotsString: string;
    durationMinutes: number | '';
};

const initialFormState: FormState = {
    name: '', price: '', imageUrl: '', isAvailable: true, emoji: '', description: '',
    slotsString: '', durationMinutes: 60,
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
            className="group flex flex-col items-center justify-center w-full h-full min-h-[280px] bg-indigo-900/40 border-2 border-dashed border-indigo-500/50 rounded-2xl text-indigo-400 hover:border-indigo-400 hover:text-white transition-all duration-300 shadow-lg hover:shadow-indigo-500/20"
        >
            <svg className="w-12 h-12 mb-2 transition-transform group-hover:scale-110 group-hover:rotate-12 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-bold text-lg">Add New Screen</span>
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
                    {item.isAvailable ? 'ACTIVE' : 'INACTIVE'}
                 </button>
             </div>
        </div>
        <div className="p-4 flex-grow flex flex-col">
            <h3 className="font-bold text-gray-200 flex-grow">{item.emoji} {item.name}</h3>
            <div className="mt-2 space-y-1">
                <p className="font-bold text-indigo-400 text-lg">₹{item.price.toFixed(2)} <span className="text-xs font-normal text-gray-400">per slot</span></p>
                {item.durationMinutes && (
                    <p className="text-sm text-gray-300 flex items-center gap-1">
                        ⏱️ Duration: <span className="text-white font-medium">{item.durationMinutes} mins</span>
                    </p>
                )}
                {item.slotIds && item.slotIds.length > 0 && (
                    <p className="text-sm text-gray-300 flex items-center gap-1 truncate">
                        🎬 Slots: <span className="text-white font-medium truncate" title={item.slotIds.join(', ')}>{item.slotIds.join(', ')}</span>
                    </p>
                )}
            </div>
        </div>
        <div className="bg-gray-700/50 p-2 flex justify-end gap-2">
            <button type="button" onClick={() => onEdit(item)} className="text-sm bg-gray-600 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-gray-500 transition-colors">Edit</button>
            <button type="button" onClick={() => onDelete(item.id)} className="text-sm bg-red-800 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors">Delete</button>
        </div>
    </div>
);


const GamesManagementPage: React.FC = () => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState<FormState>(initialFormState);
    const { user } = useAuth();
    
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState('');

    // Tab view selection
    const [activeTab, setActiveTab] = useState<'services' | 'combined'>('services');

    // Combined Groups state variables
    const [combinedGroups, setCombinedGroups] = useState<CombinedGroup[]>([]);
    const [groupOrders, setGroupOrders] = useState<Order[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<CombinedGroup | null>(null);
    const [groupForm, setGroupForm] = useState({
        name: '',
        description: '',
        serviceIds: [] as string[],
        roomIds: [] as string[]
    });
    const [newRoomInput, setNewRoomInput] = useState('');
    
    // Calendar view selector
    const [selectedGroupCalendar, setSelectedGroupCalendar] = useState<string>('');

    const fetchMenu = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('name');
                
            if (error) throw error;
            
            const formattedData = (data || []).map(item => ({
                ...item,
                imageUrl: item.image_url,
                isAvailable: item.is_available,
                slotIds: item.slot_ids,
                durationMinutes: item.duration_minutes
            })).filter(item => item.category === 'game');
            
            setMenuItems(formattedData as MenuItem[]);
        } catch (error) { 
            console.warn("Supabase fetch failed (Offline Mode Active):", (error as any).message || error);
            try {
                const mockData = await getMockMenu();
                setMenuItems(mockData.filter(i => i.category === 'game'));
            } catch (mockErr) {
                console.error("Critical: Failed to load menu from mock.", mockErr);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Load combined group and order data
    const fetchCombinedGroupsData = useCallback(async () => {
        setLoadingGroups(true);
        try {
            const groups = await getCombinedGroups();
            setCombinedGroups(groups);
            
            if (groups.length > 0 && !selectedGroupCalendar) {
                setSelectedGroupCalendar(groups[0].id);
            }
            
            const ordersList = await getOwnerOrders();
            // Filter game orders for conflict monitoring
            setGroupOrders(ordersList.filter(o => 
                o.items.some(item => item.category === 'game')
            ));
        } catch (error) {
            console.error("Failed to load combined services data:", error);
        } finally {
            setLoadingGroups(false);
        }
    }, [selectedGroupCalendar]);

    useEffect(() => {
        setLoading(true);
        fetchMenu();
    }, [fetchMenu]);

    useEffect(() => {
        if (activeTab === 'combined') {
            fetchCombinedGroupsData();
        }
    }, [activeTab, fetchCombinedGroupsData]);
    
    const handleOpenModal = (item: MenuItem | null = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name, price: item.price, imageUrl: item.imageUrl, isAvailable: item.isAvailable,
                emoji: item.emoji || '', description: item.description || '',
                slotsString: item.slotIds ? item.slotIds.join(', ') : '',
                durationMinutes: item.durationMinutes || 60,
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
        setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : (name === 'price' || name === 'durationMinutes' ? (value === '' ? '' : parseInt(value)) : value) }));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (formData.price === '' || formData.durationMinutes === '' || !formData.imageUrl) return;

        const slotIds = formData.slotsString.split(',').map(s => s.trim()).filter(s => s !== '');

        const payload = {
            name: formData.name,
            price: formData.price,
            image_url: formData.imageUrl,
            is_available: formData.isAvailable,
            emoji: formData.emoji,
            description: formData.description,
            category: 'game',
            slot_ids: slotIds,
            duration_minutes: formData.durationMinutes
        };

        try {
            if (editingItem) {
                await updateMockItem(editingItem.id, payload);
            } else {
                await addMockItem(payload, user.id);
            }
            
            fetchMenu();
            handleCloseModal();
            window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: `Screen ${editingItem ? 'updated' : 'added'} successfully!` } }));

        } catch (error) { 
            console.error("Save failed:", error);
            const msg = (error as any).message || JSON.stringify(error);
            window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: `Save Failed: ${msg}` } }));
        }
    };
    
    const handleDeleteMenuItem = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this screen item?")) {
            return;
        }

        try {
            await removeMockItem(id);
            setMenuItems(prev => prev.filter(item => item.id !== id));
            window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: 'Screen deleted successfully.' } }));
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete screen: " + ((error as any).message || "Unknown error"));
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

    // COMBINED GROUPS CODE IMPLEMENTATIONS
    const allUniqueSlots = useMemo(() => {
        const set = new Set<string>();
        menuItems.forEach(item => {
            if (item.slotIds) {
                item.slotIds.forEach(slot => set.add(slot));
            }
        });
        return Array.from(set);
    }, [menuItems]);

    const handleOpenGroupModal = (group: CombinedGroup | null = null) => {
        if (group) {
            setEditingGroup(group);
            setGroupForm({
                name: group.name,
                description: group.description || '',
                serviceIds: group.serviceIds || [],
                roomIds: group.roomIds || []
            });
        } else {
            setEditingGroup(null);
            setGroupForm({
                name: '',
                description: '',
                serviceIds: [],
                roomIds: []
            });
        }
        setNewRoomInput('');
        setIsGroupModalOpen(true);
    };

    const handleCloseGroupModal = () => {
        setIsGroupModalOpen(false);
        setEditingGroup(null);
    };

    const handleGroupFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setGroupForm(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleServiceInGroup = (serviceId: string) => {
        setGroupForm(prev => {
            const alreadyIn = prev.serviceIds.includes(serviceId);
            const filtered = alreadyIn 
                ? prev.serviceIds.filter(id => id !== serviceId)
                : [...prev.serviceIds, serviceId];
            return { ...prev, serviceIds: filtered };
        });
    };

    const handleAddRoomToGroup = () => {
        const val = newRoomInput.trim();
        if (!val) return;
        if (groupForm.roomIds.includes(val)) {
            setNewRoomInput('');
            return;
        }
        setGroupForm(prev => ({
            ...prev,
            roomIds: [...prev.roomIds, val]
        }));
        setNewRoomInput('');
    };

    const handleRemoveRoomFromGroup = (room: string) => {
        setGroupForm(prev => ({
            ...prev,
            roomIds: prev.roomIds.filter(r => r !== room)
        }));
    };

    const handleSaveGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!groupForm.name.trim()) return;

        try {
            const payload = {
                name: groupForm.name,
                description: groupForm.description,
                serviceIds: groupForm.serviceIds,
                roomIds: groupForm.roomIds,
                ownerId: user.id
            };

            if (editingGroup) {
                await updateCombinedGroup(editingGroup.id, payload);
            } else {
                await createCombinedGroup(payload);
            }

            window.dispatchEvent(new CustomEvent('show-owner-toast', { 
                detail: { message: `Combined Group "${groupForm.name}" ${editingGroup ? 'updated' : 'created'} successfully!` } 
            }));
            
            await fetchCombinedGroupsData();
            handleCloseGroupModal();
        } catch (error) {
            console.error("Save combined group failed:", error);
            alert("Could not save combined group.");
        }
    };

    const handleDeleteGroup = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete the Combined Group "${name}"? SERVICES in the group will not be deleted; only their shared availability relationship will be removed.`)) {
            return;
        }

        try {
            await deleteCombinedGroup(id);
            setCombinedGroups(prev => prev.filter(g => g.id !== id));
            window.dispatchEvent(new CustomEvent('show-owner-toast', { 
                detail: { message: 'Combined relationship deleted successfully.' } 
            }));
            
            if (selectedGroupCalendar === id) {
                setSelectedGroupCalendar('');
            }
        } catch (error) {
            console.error("Delete group failed:", error);
        }
    };

    // Shared availability map & calendar timeline generator
    const activeCalendarGroup = useMemo(() => {
        return combinedGroups.find(g => g.id === selectedGroupCalendar);
    }, [combinedGroups, selectedGroupCalendar]);

    const activeGroupBookings = useMemo(() => {
        if (!activeCalendarGroup) return [];
        // Extract all services linked in the active group
        const linkedServiceIds = activeCalendarGroup.serviceIds;
        
        // Find all orders that contain any of these linked serviceIds
        return groupOrders.filter(order => 
            order.items.some(oi => linkedServiceIds.includes(oi.id))
        );
    }, [activeCalendarGroup, groupOrders]);

    if (loading) return <p className="text-gray-300 text-center py-10">Loading screens and configurations...</p>;

    return (
        <div className="mt-8">
            {/* Header and Sub Navigation Segment Control */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-200 tracking-tight font-heading">Available Slots / Rooms</h1>
                    <p className="text-gray-400 text-sm mt-1">Configure screens, rooms, pricing, and combined groups sharing the same floor structures.</p>
                </div>
                
                <div className="flex bg-gray-900/60 p-1 rounded-xl border border-gray-700 w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'services' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        🎬 Rooms & Services
                    </button>
                    <button
                        onClick={() => setActiveTab('combined')}
                        className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'combined' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        🔗 Combined Services Group
                    </button>
                </div>
            </div>

            {activeTab === 'services' ? (
                /* ROOMS & SERVICES PRIMARY LAYOUT */
                <div className="space-y-6">
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
                        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                            <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-down max-h-[90vh] overflow-y-auto scrollbar-thin">
                                <h2 className="text-2xl font-bold mb-6 text-white font-heading">{editingItem ? 'Edit Service / Screen' : 'Add New Service / Screen'}</h2>
                                <form onSubmit={handleSubmit} className="space-y-4 text-gray-300">
                                    <InputField label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
                                    <InputField label="Emoji (Optional)" name="emoji" value={formData.emoji} placeholder="e.g., 🎬" onChange={handleInputChange} />
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="Price (₹)" name="price" type="number" value={formData.price} onChange={handleInputChange} required step="1" min="0" />
                                        <InputField label="Duration (Minutes)" name="durationMinutes" type="number" value={formData.durationMinutes} onChange={handleInputChange} required min="1" />
                                    </div>

                                    <InputField 
                                        label="Room Slots / Physical Identifiers" 
                                        name="slotsString" 
                                        value={formData.slotsString} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g., Room A, Room B" 
                                    />
                                    <p className="text-xs text-gray-500 -mt-3 mb-2">Enter available physical rooms / theater identifiers separated by commas.</p>
                                    
                                     <div>
                                        <label className="block text-gray-300 font-semibold mb-2">Screen/Service Banner Image</label>
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

                                    <TextAreaField label="Description" name="description" value={formData.description} onChange={handleInputChange} />
                                    
                                    <CheckboxField label="Service is active for instant booking" name="isAvailable" checked={formData.isAvailable} onChange={handleInputChange} />

                                    <div className="flex justify-end gap-4 pt-4">
                                        <button type="button" onClick={handleCloseModal} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                                        <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">{editingItem ? 'Save Changes' : 'Add Screen'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* COMBINED SERVICES ADVANCED GROUPS LAYOUT */
                <div className="space-y-8 animate-fade-in-up">
                    <div className="bg-gray-800/40 border border-gray-700 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white font-heading">Combined Service Relationships</h2>
                            <p className="text-gray-400 text-sm mt-1">Make sibling services block the same physical rooms simultaneously upon successful slot registration.</p>
                        </div>
                        <button
                            onClick={() => handleOpenGroupModal()}
                            className="bg-indigo-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all text-sm shrink-0"
                        >
                            ➕ Create Combined Group
                        </button>
                    </div>

                    {loadingGroups ? (
                        <p className="text-gray-400 text-center py-10 animate-pulse">Querying relational availability state...</p>
                    ) : combinedGroups.length === 0 ? (
                        <div className="text-center py-12 bg-gray-800/20 border border-dashed border-gray-700 rounded-2xl">
                            <span className="text-5xl block">🔗</span>
                            <h3 className="text-lg font-bold text-gray-300 mt-4">No Combined Groups Yet</h3>
                            <p className="text-gray-500 text-sm max-w-md mx-auto mt-2">Associate multiple services like "Birthday Party" and "Private Theater" to share availability on Rooms.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {combinedGroups.map(group => {
                                // Find names of services linked in this group
                                const servicesNames = group.serviceIds.map(id => {
                                    const service = menuItems.find(item => item.id === id);
                                    return service ? `${service.emoji || '🎬'} ${service.name} (₹${service.price})` : null;
                                }).filter(Boolean);

                                return (
                                    <div key={group.id} className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300 relative">
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="text-xl font-bold text-white tracking-tight">{group.name}</h3>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleOpenGroupModal(group)}
                                                        className="text-xs bg-gray-700 hover:bg-gray-600 font-semibold px-2.5 py-1.5 rounded-lg text-gray-200 transition-all"
                                                        title="Edit Group"
                                                    >
                                                        🔧 Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteGroup(group.id, group.name)}
                                                        className="text-xs bg-red-950/50 hover:bg-red-900 border border-red-500/20 font-semibold px-2.5 py-1.5 rounded-lg text-red-300 transition-all"
                                                        title="Delete Relationship"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {group.description && (
                                                <p className="text-gray-400 text-xs mb-4 line-clamp-2">{group.description}</p>
                                            )}

                                            {/* Rooms / Slots shared */}
                                            <div className="mb-4">
                                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1.5">Shared Rooms / Physical Slots</span>
                                                {group.roomIds && group.roomIds.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {group.roomIds.map(room => (
                                                            <span key={room} className="text-xs font-bold leading-normal bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-md">
                                                                🚪 {room}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-500 italic">No slots declared in this group.</span>
                                                )}
                                            </div>

                                            {/* Services Linked */}
                                            <div>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5">Linked Services ({servicesNames.length})</span>
                                                <div className="space-y-1.5">
                                                    {servicesNames.length > 0 ? (
                                                        servicesNames.map((name, idx) => (
                                                            <div key={idx} className="bg-black/30 border border-white/5 py-1.5 px-3 rounded-lg text-xs font-medium text-gray-300 flex items-center justify-between">
                                                                <span className="truncate">{name}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-500 italic">No services linked. Update to add services.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-gray-700/60">
                                            <button
                                                onClick={() => setSelectedGroupCalendar(group.id)}
                                                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${selectedGroupCalendar === group.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'}`}
                                            >
                                                📅 {selectedGroupCalendar === group.id ? 'Viewing Availability Map' : 'Select to View Availability Map'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Shared Availability Calendar & Booking Conflict Monitor Area */}
                    {activeCalendarGroup && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-gray-700/50">
                            {/* Calendar Map Column */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white font-heading">Shared Availability Calendar</h3>
                                            <p className="text-xs text-gray-400 mt-1">Live slot reservation index for <strong>{activeCalendarGroup.name}</strong>. Occupying one service locks sister listings in the corresponding rooms.</p>
                                        </div>
                                        <span className="bg-indigo-900/50 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold font-mono">Live Sync</span>
                                    </div>

                                    {/* Availability list */}
                                    {activeCalendarGroup.roomIds.length === 0 ? (
                                        <div className="p-6 text-center text-gray-500 text-sm font-semibold">
                                            Please define Rooms in this group to initialize the Availability Calendar.
                                        </div>
                                    ) : (
                                        <div className="space-y-6 mt-4">
                                            {activeCalendarGroup.roomIds.map(room => {
                                                // Find bookings for this room slot
                                                const roomBookings = activeGroupBookings.filter(o => 
                                                    o.items.some(oi => oi.selectedSlotId === room)
                                                );

                                                return (
                                                    <div key={room} className="bg-gray-900/40 border border-gray-700 p-4 rounded-xl space-y-3">
                                                        <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-black text-gray-200">🚪 Room Slot: {room === 'Hall 1' ? 'Main Lobby Hall' : room}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-400 font-mono">
                                                                {roomBookings.length} Active Booking{roomBookings.length !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>

                                                        {roomBookings.length === 0 ? (
                                                            <div className="py-4 text-center">
                                                                <span className="text-green-400 font-bold text-xs bg-green-950/50 px-3 py-1.5 rounded-full">🟢 Ready for bookings (All linked services are free and open!)</span>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2.5">
                                                                {roomBookings.map((b, bIdx) => {
                                                                    // Extract exact active room item
                                                                    const item = b.items.find(oi => oi.selectedSlotId === room);
                                                                    let formattedTime = '10:00 AM – 01:00 PM';
                                                                    if (b.gameEndTime && b.gameStartTime) {
                                                                        const start = new Date(b.gameStartTime);
                                                                        const end = new Date(b.gameEndTime);
                                                                        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                                                            formattedTime = `${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                                                                        }
                                                                    } else if (b.gameStartTime) {
                                                                        const start = new Date(b.gameStartTime);
                                                                        if (!isNaN(start.getTime())) {
                                                                            const duration = item?.durationMinutes || 60;
                                                                            const end = new Date(start.getTime() + duration * 60000);
                                                                            formattedTime = `${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                                                                        }
                                                                    } else if (item?.selectedStartTime) {
                                                                        const start = new Date(item.selectedStartTime);
                                                                        if (!isNaN(start.getTime())) {
                                                                            const duration = item?.durationMinutes || 60;
                                                                            const end = new Date(start.getTime() + duration * 60000);
                                                                            formattedTime = `${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                                                                        } else {
                                                                            formattedTime = item.selectedStartTime;
                                                                        }
                                                                    }

                                                                    return (
                                                                        <div key={bIdx} className="bg-red-950/20 border border-red-500/25 p-3 rounded-lg block">
                                                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                                                <div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-xs font-black text-red-300">🔴 OCCUPIED BY:</span>
                                                                                        <span className="text-xs bg-red-900/60 text-red-200 px-2 py-0.5 rounded font-extrabold">{item?.name}</span>
                                                                                    </div>
                                                                                    <p className="text-[11px] text-gray-400 mt-1">Booked by {b.studentName} for {item?.durationMinutes || 60} mins ({formattedTime})</p>
                                                                                </div>
                                                                                <span className="text-[10px] bg-red-900/60 text-red-200 px-2 py-1.5 rounded-md font-bold text-center">
                                                                                    Blocks All Brother Services
                                                                                </span>
                                                                            </div>
                                                                            
                                                                            {/* Brother blocking warning list */}
                                                                            <div className="mt-2 pt-2 border-t border-red-500/10 flex flex-wrap gap-2 items-center">
                                                                                <span className="text-[9px] text-red-400/80 font-bold uppercase tracking-widest">Shared Block Status:</span>
                                                                                {activeCalendarGroup.serviceIds.filter(id => id !== item?.id).map(id => {
                                                                                    const service = menuItems.find(m => m.id === id);
                                                                                    return service ? (
                                                                                        <span key={id} className="text-[10px] font-bold bg-black/40 text-gray-400 line-through px-2 py-0.5 rounded border border-white/5 opacity-60">
                                                                                            {service.name} (Blocked)
                                                                                        </span>
                                                                                    ) : null;
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Booking Conflict Monitoring Panel Column */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white font-heading mb-1 flex items-center gap-2">
                                        🛡️ Booking Conflict Monitor
                                    </h3>
                                    <p className="text-xs text-gray-400 mb-4">Pre-emptive conflict analysis engine tracking overlapping shared room records.</p>
                                    
                                    <div className="space-y-4">
                                        <div className="bg-black/30 border border-green-500/20 p-3 rounded-xl flex items-start gap-2.5">
                                            <span className="text-green-500 font-extrabold text-sm">✅</span>
                                            <div>
                                                <p className="text-xs font-bold text-white leading-tight">Shared Collision Prevention</p>
                                                <p className="text-[11px] text-gray-400 mt-1">Automatic guardrail checks block sister service slots on the customer checkout views immediately upon order receipt.</p>
                                            </div>
                                        </div>

                                        <div className="bg-black/30 border border-indigo-500/25 p-4 rounded-xl space-y-3">
                                            <span className="text-xs font-black tracking-widest uppercase text-indigo-400 block pb-1 border-b border-indigo-500/10">LIVE SUMMARY</span>
                                            
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-400">Services in Group:</span>
                                                    <span className="text-white font-mono font-bold">{activeCalendarGroup.serviceIds.length} Linked</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-400">Shared Rooms:</span>
                                                    <span className="text-white font-mono font-bold">{activeCalendarGroup.roomIds.length} Rooms</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-400">Total Bookings Today:</span>
                                                    <span className="text-white font-mono text-indigo-300 font-bold">{activeGroupBookings.length} Active</span>
                                                </div>
                                            </div>
                                        </div>

                                        {activeGroupBookings.length > 0 && (
                                            <div className="space-y-2.5">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">CONSTRAINTS LOG</span>
                                                <div className="max-h-56 overflow-y-auto scrollbar-thin space-y-2">
                                                    {activeGroupBookings.map((b, bIdx) => {
                                                        const item = b.items.find(oi => activeCalendarGroup.serviceIds.includes(oi.id));
                                                        return (
                                                            <div key={bIdx} className="p-2.5 bg-black/40 border border-white/5 rounded-lg text-[11px]">
                                                                <p className="text-gray-300 font-bold">Booking of "{item?.name || 'Service'}"</p>
                                                                <p className="text-gray-500 mt-1">Status: Active</p>
                                                                <p className="text-indigo-300 font-bold mt-1">❌ Locks slot "{item?.selectedSlotId || 'N/A'}" for other services.</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CREATE / EDIT COMBINED GROUP MODAL */}
                    {isGroupModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                            <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-xl animate-fade-in-down max-h-[90vh] overflow-y-auto scrollbar-thin">
                                <h2 className="text-2xl font-bold mb-5 text-white font-heading">{editingGroup ? 'Edit Combined Relationship' : 'Create Combined Group'}</h2>
                                <form onSubmit={handleSaveGroup} className="space-y-4 text-gray-300">
                                    <InputField 
                                        label="Group Name" 
                                        name="name" 
                                        value={groupForm.name} 
                                        onChange={handleGroupFormChange} 
                                        placeholder="e.g., Room A Shared Group" 
                                        required 
                                    />
                                    
                                    <TextAreaField 
                                        label="Group Description (Optional)" 
                                        name="description" 
                                        value={groupForm.description} 
                                        onChange={handleGroupFormChange} 
                                        placeholder="Describe the shared physical space or room details..." 
                                    />

                                    {/* Link Services Checkbox List */}
                                    <div>
                                        <label className="block text-gray-300 font-bold mb-2">Link Existing Services / Screens</label>
                                        <p className="text-xs text-gray-400 mb-3">All checked services will share availability, preventing any room double bookings.</p>
                                        
                                        {menuItems.length === 0 ? (
                                            <p className="text-xs text-gray-500 italic">No screen services available. Create screens first.</p>
                                        ) : (
                                            <div className="bg-black/30 border border-gray-700/60 rounded-xl p-3 max-h-44 overflow-y-auto space-y-2.5">
                                                {menuItems.map(item => {
                                                    const isChecked = groupForm.serviceIds.includes(item.id);
                                                    return (
                                                        <label key={item.id} className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-white/5 rounded-lg transition-all">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isChecked}
                                                                onChange={() => handleToggleServiceInGroup(item.id)}
                                                                className="form-checkbox h-4 w-4 bg-gray-900 border-gray-600 text-indigo-500 rounded focus:ring-indigo-500" 
                                                            />
                                                            <div className="flex justify-between items-center w-full pr-1">
                                                                <span className="text-xs font-semibold text-gray-200">{item.emoji || '🎬'} {item.name}</span>
                                                                <span className="text-xs font-mono font-bold text-indigo-400">₹{item.price}</span>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Room IDs Management Section */}
                                    <div>
                                        <label className="block text-gray-300 font-bold mb-1">Define Shared Room Slots</label>
                                        <p className="text-xs text-gray-400 mb-3">Add the specific slot names or room IDs (e.g. "Room A", "SCREEN 1") to enforce shared blocking.</p>
                                        
                                        <div className="flex gap-2 mb-3">
                                            <input 
                                                type="text"
                                                value={newRoomInput}
                                                onChange={(e) => setNewRoomInput(e.target.value)}
                                                placeholder="e.g., Room A" 
                                                className="flex-grow px-4 py-2 bg-gray-900 text-white border border-gray-650 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRoomToGroup(); } }}
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleAddRoomToGroup}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-xs shrink-0"
                                            >
                                                ➕ Add Room
                                            </button>
                                        </div>

                                        {/* Suggested Rooms from Services */}
                                        {allUniqueSlots.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wider">Suggested from existing screens:</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {allUniqueSlots.map(slot => {
                                                        const isAdded = groupForm.roomIds.includes(slot);
                                                        return (
                                                            <button
                                                                key={slot}
                                                                type="button"
                                                                disabled={isAdded}
                                                                onClick={() => setGroupForm(prev => ({ ...prev, roomIds: [...prev.roomIds, slot] }))}
                                                                className={`text-[10px] font-bold px-2 py-1 rounded border transition-all ${isAdded ? 'bg-indigo-950/20 text-gray-600 border-gray-800 line-through' : 'bg-gray-900 border-gray-700 text-indigo-300 hover:border-indigo-500/50 hover:bg-indigo-950/40'}`}
                                                            >
                                                                + {slot}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Current Group Room list */}
                                        <div className="bg-black/20 border border-gray-700/60 rounded-xl p-3 min-h-[50px] flex flex-wrap gap-2">
                                            {groupForm.roomIds.length === 0 ? (
                                                <span className="text-xs text-gray-500 italic m-auto">Please declare at least one room / screen slot for this group.</span>
                                            ) : (
                                                groupForm.roomIds.map(room => (
                                                    <span key={room} className="text-xs font-bold leading-normal bg-indigo-950 text-indigo-300 border border-indigo-500/30 pl-3 pr-1 py-1 rounded-md flex items-center gap-1.5 animate-fade-in">
                                                        🚪 {room}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveRoomFromGroup(room)}
                                                            className="text-indigo-400 hover:text-white rounded hover:bg-indigo-900/60 p-0.5"
                                                        >
                                                            ✕
                                                        </button>
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4 pt-4">
                                        <button type="button" onClick={handleCloseGroupModal} className="bg-gray-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-gray-500 transition-colors text-xs font-semibold">Cancel</button>
                                        <button type="submit" className="bg-indigo-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-indigo-700 transition-colors text-xs font-semibold">
                                            {editingGroup ? 'Save Changes' : 'Create Relationship'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const InputField: React.FC<any> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-gray-300 font-semibold mb-2">{label}</label>
        <input id={props.name} {...props} className="w-full px-4 py-2 border border-gray-650 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
    </div>
);
const TextAreaField: React.FC<any> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-gray-300 font-semibold mb-2">{label}</label>
        <textarea id={props.name} rows={2} {...props} className="w-full px-4 py-2 border border-gray-650 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
    </div>
);
const CheckboxField: React.FC<any> = ({ label, ...props }) => (
    <label className="flex items-center">
        <input type="checkbox" {...props} className="form-checkbox h-5 w-5 bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-500 rounded"/>
        <span className="ml-3 font-medium">{label}</span>
    </label>
);

export default GamesManagementPage;
