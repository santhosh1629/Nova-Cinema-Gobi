
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOwnerCommissions } from '../../services/mockApi';
import { useAuth } from '../../context/AuthContext';
import type { CommissionRecord } from '../../types';

const OwnerCommissionPage: React.FC = () => {
    const { user } = useAuth();
    const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                try {
                    const data = await getOwnerCommissions(user.id);
                    setCommissions(data);
                } catch (error) {
                    console.error("Failed to fetch commissions", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [user]);

    if (!user) return null;

    return (
        <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                    <Link to="/owner/dashboard" className="text-indigo-400 hover:underline">&larr; Back to Dashboard</Link>
                </div>
                
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-heading">Commission Report 📑</h1>
                        <p className="text-gray-400 text-sm mt-1">Platform fees (3%) payable to Admin</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                        <p className="mt-4 text-gray-400">Loading your report...</p>
                    </div>
                ) : commissions.length === 0 ? (
                    <div className="bg-gray-800 p-8 rounded-xl text-center border border-gray-700">
                        <p className="text-gray-400 text-lg">No commission data available yet.</p>
                        <p className="text-gray-500 text-sm mt-2">Reports are generated at the end of each month.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {commissions.map((record) => (
                            <div key={record.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4 transition-transform hover:scale-[1.01]">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{record.month}</h3>
                                    <p className="text-gray-400 text-sm">Based on Total Income: <span className="text-gray-200 font-semibold">₹{record.totalIncome.toLocaleString()}</span></p>
                                </div>
                                <div className="text-center sm:text-right bg-black/30 p-4 rounded-lg min-w-[150px]">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Commission Due</p>
                                    <p className="text-2xl font-black text-indigo-400">₹{record.commissionAmount.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerCommissionPage;
