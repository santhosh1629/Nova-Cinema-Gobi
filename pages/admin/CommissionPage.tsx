
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/common/Header';
import { getAllCommissions, generateMonthlyCommissions } from '../../services/mockApi';
import type { CommissionRecord } from '../../types';

const CommissionPage: React.FC = () => {
    const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const data = await getAllCommissions();
            setCommissions(data);
        } catch (error) {
            console.error("Failed to fetch commissions", error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleForceCalculate = async () => {
        setIsRefreshing(true);
        await generateMonthlyCommissions();
        await fetchData();
    };

    return (
        <div className="bg-gray-900 min-h-screen text-white">
            <Header />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link to="/admin/dashboard" className="text-indigo-400 hover:underline">&larr; Back</Link>
                        </div>
                        <h1 className="text-3xl font-bold font-heading">Monthly Commissions 💸</h1>
                        <p className="text-gray-400 text-sm">3% Platform Fee Calculation</p>
                    </div>
                    <button 
                        onClick={handleForceCalculate} 
                        disabled={isRefreshing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:bg-gray-600"
                    >
                        {isRefreshing ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                                Updating...
                            </>
                        ) : (
                            <>🔄 Refresh Data</>
                        )}
                    </button>
                </div>

                <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Month</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Canteen Owner</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Income</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider">Commission (3%)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Loading commission data...</td>
                                    </tr>
                                ) : commissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No commission records generated yet.</td>
                                    </tr>
                                ) : (
                                    commissions.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{record.month}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{record.ownerName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₹{record.totalIncome.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-green-400">₹{record.commissionAmount.toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                    <p className="text-yellow-200 text-sm text-center">
                        ℹ️ This report is automatically updated on the 28th of every month. 
                    </p>
                </div>
            </main>
        </div>
    );
};

export default CommissionPage;
