import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/common/Header';
import { getPendingOwnerRequests, getApprovedOwners, getRejectedOwners, updateOwnerApprovalStatus, removeOwnerAccount } from '../../services/mockApi';
import type { User } from '../../types';

type Tab = 'pending' | 'approved' | 'rejected';

const OwnerRequestCard: React.FC<{ 
    owner: User; 
    onUpdateStatus?: (userId: string, status: 'approved' | 'rejected') => void; 
    onRemove?: (user: User) => void;
    onViewProof: (url: string) => void;
    isUpdating: boolean;
}> = ({ owner, onUpdateStatus, onRemove, onViewProof, isUpdating }) => (
    <div className="bg-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden flex flex-col">
        <div className="p-5 flex-grow">
            <h3 className="text-lg font-bold text-white">{owner.canteenName || 'N/A'}</h3>
            <p className="text-sm text-gray-400 mb-3">by {owner.username}</p>
            <div className="space-y-1 text-sm">
                <p className="text-gray-300"><strong>Email:</strong> {owner.email}</p>
                <p className="text-gray-300"><strong>Phone:</strong> {owner.phone}</p>
            </div>
        </div>
        <div className="bg-gray-700/50 p-4 flex flex-wrap gap-2 justify-end items-center">
            {owner.idProofUrl && (
                <button onClick={() => onViewProof(owner.idProofUrl)} className="text-sm bg-gray-600 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-gray-500 transition-colors">
                    View ID
                </button>
            )}
            {owner.approvalStatus === 'pending' && onUpdateStatus && (
                <>
                    <button 
                        onClick={() => onUpdateStatus(owner.id, 'rejected')} 
                        disabled={isUpdating}
                        className="text-sm bg-red-600 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400"
                    >
                        ❌ Reject
                    </button>
                    <button 
                        onClick={() => onUpdateStatus(owner.id, 'approved')} 
                        disabled={isUpdating}
                        className="text-sm bg-green-600 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400"
                    >
                        ✅ Approve
                    </button>
                </>
            )}
             {owner.approvalStatus === 'approved' && (
                 <>
                    <p className="text-xs text-green-400 font-semibold mr-auto">Approved on {new Date(owner.approvalDate!).toLocaleDateString()}</p>
                    {onRemove && (
                         <button 
                            onClick={() => onRemove(owner)}
                            disabled={isUpdating}
                            className="text-sm bg-red-800 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors disabled:bg-red-600"
                        >
                           🗑️ Remove Access
                        </button>
                    )}
                 </>
            )}
             {owner.approvalStatus === 'rejected' && (
                <p className="text-xs text-red-400 font-semibold">Rejected</p>
            )}
        </div>
    </div>
);


const ApprovalPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('pending');
    const [pending, setPending] = useState<User[]>([]);
    const [approved, setApproved] = useState<User[]>([]);
    const [rejected, setRejected] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
    const [ownerToRemove, setOwnerToRemove] = useState<User | null>(null);


    const fetchAllRequests = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [pendingData, approvedData, rejectedData] = await Promise.all([
                getPendingOwnerRequests(),
                getApprovedOwners(),
                getRejectedOwners()
            ]);
            setPending(pendingData);
            setApproved(approvedData);
            setRejected(rejectedData);
        } catch (err) {
            setError("Failed to fetch approval requests.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllRequests();
    }, [fetchAllRequests]);

    const handleUpdateStatus = async (userId: string, status: 'approved' | 'rejected') => {
        setUpdatingId(userId);
        try {
            await updateOwnerApprovalStatus(userId, status);
            fetchAllRequests(); // Refetch all lists to update UI
        } catch (err) {
            setError(`Failed to update status for user ${userId}.`);
            console.error(err);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleConfirmRemove = async () => {
        if (!ownerToRemove) return;
        setUpdatingId(ownerToRemove.id);
        try {
            await removeOwnerAccount(ownerToRemove.id);
            fetchAllRequests(); // Refetch to update lists
        } catch (err) {
            setError(`Failed to remove owner ${ownerToRemove.username}.`);
            console.error(err);
        } finally {
            setUpdatingId(null);
            setOwnerToRemove(null); // Close modal
        }
    };


    const TabButton: React.FC<{ tab: Tab; label: string; count: number; }> = ({ tab, label, count }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold rounded-md text-sm transition-colors flex items-center gap-2 ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
        >
            {label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-white text-indigo-600' : 'bg-gray-600 text-white'}`}>{count}</span>
        </button>
    );
    
    const renderList = (owners: User[], type: Tab) => {
        if (loading) {
            return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-800 rounded-lg h-48"></div>)}
            </div>;
        }
        if (owners.length === 0) {
            return <p className="text-center text-gray-400 py-8">No owners found in this category.</p>;
        }
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {owners.map(req => (
                <OwnerRequestCard 
                    key={req.id} 
                    owner={req} 
                    onUpdateStatus={type === 'pending' ? handleUpdateStatus : undefined}
                    onRemove={type === 'approved' ? setOwnerToRemove : undefined}
                    onViewProof={setProofModalUrl}
                    isUpdating={updatingId === req.id}
                />
            ))}
        </div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white">
            <Header />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center mb-6">
                    <Link to="/admin/dashboard" className="text-indigo-400 hover:underline">&larr; Back to Dashboard</Link>
                </div>
                <h1 className="text-4xl font-bold text-white mb-6">Cinema Owner Approvals</h1>

                <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-2 rounded-lg flex flex-wrap gap-2 mb-6 sticky top-20 z-10">
                    <TabButton tab="pending" label="Pending Requests" count={pending.length} />
                    <TabButton tab="approved" label="Approved Owners" count={approved.length} />
                    <TabButton tab="rejected" label="Rejected Owners" count={rejected.length} />
                </div>
                
                {error && <p className="text-red-500 mb-4">{error}</p>}
                
                <div>
                    {activeTab === 'pending' && renderList(pending, 'pending')}
                    {activeTab === 'approved' && renderList(approved, 'approved')}
                    {activeTab === 'rejected' && renderList(rejected, 'rejected')}
                </div>

                {proofModalUrl && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setProofModalUrl(null)}>
                        <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
                            <img src={proofModalUrl} alt="ID Proof" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
                            <button onClick={() => setProofModalUrl(null)} className="absolute -top-2 -right-2 bg-white text-black rounded-full h-8 w-8 font-bold flex items-center justify-center">&times;</button>
                        </div>
                    </div>
                )}
                
                {ownerToRemove && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                        <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl w-full max-w-sm animate-fade-in-down">
                            <h2 className="text-xl font-bold mb-4 text-center text-white">Revoke Access</h2>
                            <p className="text-center text-gray-300 mb-2">
                                Are you sure you want to remove <span className="font-bold">{ownerToRemove.username}</span> ({ownerToRemove.canteenName})?
                            </p>
                             <p className="text-center text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-md mb-6">
                                This action is permanent. The owner's account will be deleted, and they will need to register again to regain access.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => setOwnerToRemove(null)} disabled={!!updatingId} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleConfirmRemove} disabled={!!updatingId} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-500/50">
                                    {updatingId === ownerToRemove.id ? 'Removing...' : 'Yes, Remove'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ApprovalPage;