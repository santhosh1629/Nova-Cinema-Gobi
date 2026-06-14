import React, { useState, useEffect, useCallback } from 'react';
import { getAllRewardsForOwner, createReward, updateReward, deleteReward } from '../../services/mockApi';
import type { Reward } from '../../types';

type FormState = Omit<Reward, 'id'>;

const initialFormState: FormState = {
    title: '',
    description: '',
    pointsCost: 0,
    discount: { type: 'fixed', value: 0 },
    isActive: true,
    expiryDate: '',
};

const AddRewardCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="flex items-center justify-center">
        <button
            onClick={onClick}
            className="group flex flex-col items-center justify-center w-full h-full min-h-[280px] bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-all duration-300 shadow-lg hover:shadow-indigo-500/20"
        >
            <svg className="w-12 h-12 mb-2 transition-transform group-hover:scale-110 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-bold text-lg">Add New Reward</span>
        </button>
    </div>
);


const RewardCard: React.FC<{ reward: Reward; onEdit: (reward: Reward) => void; onDelete: (reward: Reward) => void; onToggleStatus: (reward: Reward) => void; }> = ({ reward, onEdit, onDelete, onToggleStatus }) => (
    <div className={`bg-gray-800 rounded-2xl shadow-md border border-gray-700 overflow-hidden flex flex-col transition-all duration-300 ${!reward.isActive ? 'opacity-60' : ''}`}>
        <div className="p-5 flex-grow">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-white flex-grow pr-4">{reward.title}</h3>
                <div className={`text-xs font-bold px-2 py-1 rounded-full text-white ${reward.isActive ? 'bg-green-600/80' : 'bg-red-600/80'}`}>
                    {reward.isActive ? 'ACTIVE' : 'INACTIVE'}
                </div>
            </div>
            <p className="text-sm text-gray-400 mt-2 min-h-[40px]">{reward.description}</p>
            <div className="mt-4 flex justify-between items-center">
                <p className="font-bold text-amber-400 text-2xl">{reward.pointsCost} <span className="text-base">Points</span></p>
                <p className="font-bold text-indigo-400 text-lg">
                    {reward.discount.type === 'fixed' ? `₹${reward.discount.value}` : `${reward.discount.value}%`} OFF
                </p>
            </div>
            <div className="mt-2 flex justify-between items-center">
                {reward.expiryDate && (
                    <p className="text-xs text-gray-500">
                        Expires on: {new Date(reward.expiryDate).toLocaleDateString()}
                    </p>
                )}
            </div>
        </div>
        <div className="bg-gray-700/50 p-2 flex justify-between items-center">
            <label className="flex items-center cursor-pointer px-2">
                <div className="relative">
                    <input type="checkbox" className="sr-only" checked={reward.isActive} onChange={() => onToggleStatus(reward)} />
                    <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${reward.isActive ? 'transform translate-x-4 bg-green-400' : ''}`}></div>
                </div>
                <div className="ml-2 text-xs font-semibold text-gray-300">
                    {reward.isActive ? 'Active' : 'Inactive'}
                </div>
            </label>
            <div className="flex gap-2">
                <button onClick={() => onEdit(reward)} className="text-sm bg-gray-600 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-gray-500 transition-colors">Edit</button>
                <button onClick={() => onDelete(reward)} className="text-sm bg-red-800 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors">Delete</button>
            </div>
        </div>
    </div>
);

const RewardsManagementPage: React.FC = () => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [formData, setFormData] = useState<FormState>(initialFormState);
    const [error, setError] = useState('');

    // State for deletion flow
    const [modalState, setModalState] = useState<'closed' | 'confirm-delete' | 'delete-failed'>('closed');
    const [targetReward, setTargetReward] = useState<Reward | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

    const fetchRewards = useCallback(async () => {
        try {
            const data = await getAllRewardsForOwner();
            setRewards(data);
        } catch (err) {
            console.error("Failed to fetch rewards", err);
            setError("Could not load rewards data.");
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchRewards().finally(() => setLoading(false));
    }, [fetchRewards]);

    useEffect(() => {
        if (isFormModalOpen || modalState !== 'closed') {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            
            return () => {
                document.body.style.overflow = 'auto';
                document.body.style.paddingRight = '0';
            };
        }
    }, [isFormModalOpen, modalState]);

    const handleOpenFormModal = (reward: Reward | null = null) => {
        if (reward) {
            setEditingReward(reward);
            setFormData({
                title: reward.title,
                description: reward.description,
                pointsCost: reward.pointsCost,
                discount: reward.discount,
                isActive: reward.isActive,
                expiryDate: reward.expiryDate ? reward.expiryDate.split('T')[0] : '',
            });
        } else {
            setEditingReward(null);
            setFormData(initialFormState);
        }
        setError('');
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setEditingReward(null);
        setError('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name === 'discountType' || name === 'discountValue') {
            setFormData(prev => ({ ...prev, discount: { ...prev.discount, [name === 'discountType' ? 'type' : 'value']: name === 'discountType' ? value : Number(value) } }));
        } else if (name === 'pointsCost') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : parseInt(value, 10) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.title || formData.pointsCost <= 0 || formData.discount.value <= 0) {
            setError("Title, and positive point/discount values are required.");
            return;
        }
        const payload = { ...formData, pointsCost: Number(formData.pointsCost), expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined };
        try {
            if (editingReward) {
                await updateReward(editingReward.id, payload);
            } else {
                await createReward(payload);
            }
            fetchRewards();
            handleCloseFormModal();
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleDeleteClick = (reward: Reward) => {
        setTargetReward(reward);
        setModalState('confirm-delete');
    };

    const handleConfirmDelete = async () => {
        if (!targetReward) return;
        setIsSubmittingDelete(true);
        try {
            await deleteReward(targetReward.id);
            setModalState('closed');
            fetchRewards();
            window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: 'Reward deleted successfully.' } }));
        } catch (err) {
            console.error("Failed to delete reward:", err);
            setModalState('delete-failed');
        } finally {
            setIsSubmittingDelete(false);
        }
    };

    const handleDeactivate = async () => {
        if (!targetReward) return;
        setIsSubmittingDelete(true);
        try {
            await updateReward(targetReward.id, { isActive: false });
            setModalState('closed');
            fetchRewards();
            window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: `Reward '${targetReward.title}' deactivated.` } }));
        } catch (err) {
            setError('Failed to deactivate reward.');
        } finally {
            setIsSubmittingDelete(false);
        }
    };

    const handleToggleStatus = async (reward: Reward) => {
        await updateReward(reward.id, { isActive: !reward.isActive });
        fetchRewards();
    };

    const closeDeleteModal = () => {
        setModalState('closed');
        setTargetReward(null);
    };

    if(loading) return <p>Loading rewards...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-gray-200">Manage Rewards 🏆</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <AddRewardCard onClick={() => handleOpenFormModal()} />
                {rewards.map(reward => (
                    <RewardCard 
                        key={reward.id} 
                        reward={reward}
                        onEdit={handleOpenFormModal}
                        onDelete={handleDeleteClick}
                        onToggleStatus={handleToggleStatus}
                    />
                ))}
            </div>

            {isFormModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-16 p-4">
                    <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl w-full max-w-lg animate-fade-in-down max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin">
                        <h2 className="text-2xl font-bold mb-6 text-white">{editingReward ? 'Edit Reward' : 'Create New Reward'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Title (e.g., Free Drink)" required className="w-full input"/>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full input" rows={2}/>
                            <input type="number" name="pointsCost" value={formData.pointsCost === 0 ? '' : formData.pointsCost} onChange={handleInputChange} placeholder="Points Cost (e.g., 100)" required className="w-full input" min="0"/>
                            <div className="grid grid-cols-2 gap-4">
                                <select name="discountType" value={formData.discount.type} onChange={handleInputChange} className="w-full input bg-gray-700">
                                    <option value="fixed">Fixed (₹)</option>
                                    <option value="percentage">Percentage (%)</option>
                                </select>
                                <input type="number" name="discountValue" value={formData.discount.value === 0 ? '' : formData.discount.value} onChange={handleInputChange} placeholder="Discount Value" required className="w-full input" min="0"/>
                            </div>
                            <div>
                                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-300">Expiry Date (Optional)</label>
                                <input type="date" name="expiryDate" id="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="w-full input"/>
                            </div>
                            <label className="flex items-center text-gray-200">
                                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500"/>
                                <span className="ml-2">Is Active</span>
                            </label>

                            {error && <p className="text-red-400 text-sm">{error}</p>}

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={handleCloseFormModal} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{editingReward ? 'Save Changes' : 'Create Reward'}</button>
                            </div>
                        </form>
                    </div>
                 </div>
            )}
            
            {modalState !== 'closed' && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center animate-pop-in">
                        {modalState === 'confirm-delete' && (
                            <>
                                <span className="text-5xl" role="img" aria-label="trash can">🗑️</span>
                                <h2 className="text-2xl font-bold font-heading text-white mt-4">Confirm Deletion</h2>
                                <p className="text-gray-300 my-4">Are you sure you want to permanently delete the reward <strong className="text-indigo-400">"{targetReward?.title}"</strong>? This action cannot be undone.</p>
                                <div className="flex justify-center gap-4">
                                    <button onClick={closeDeleteModal} disabled={isSubmittingDelete} className="btn-secondary px-6">Cancel</button>
                                    <button onClick={handleConfirmDelete} disabled={isSubmittingDelete} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 disabled:bg-red-500/50">
                                        {isSubmittingDelete ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </>
                        )}
                        {modalState === 'delete-failed' && (
                             <>
                                <span className="text-5xl" role="img" aria-label="warning">⚠️</span>
                                <h2 className="text-2xl font-bold font-heading text-white mt-4">Deletion Failed</h2>
                                <p className="text-gray-300 my-4">This reward cannot be deleted because it may have been redeemed by a customer. To prevent it from being used again, you can <strong className="text-amber-400">deactivate</strong> it instead.</p>
                                <div className="flex flex-col gap-3">
                                    <button onClick={handleDeactivate} disabled={isSubmittingDelete} className="bg-amber-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-amber-700 disabled:bg-amber-500/50">
                                        {isSubmittingDelete ? 'Deactivating...' : 'Deactivate Item'}
                                    </button>
                                    <button onClick={closeDeleteModal} disabled={isSubmittingDelete} className="btn-secondary px-6">Cancel</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

             <style>{`
                .input {
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    border: 1px solid #374151;
                    background-color: #1F2937;
                    color: white;
                    width: 100%;
                }
                .btn-primary {
                    background-color: #4F46E5; color: white; font-weight: bold; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: background-color 0.2s;
                }
                .btn-primary:hover { background-color: #4338CA; }
                .btn-secondary {
                    background-color: #4B5563; color: white; font-weight: bold; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: background-color 0.2s;
                }
                .btn-secondary:hover { background-color: #374151; }
            `}</style>
        </div>
    )
};

export default RewardsManagementPage;