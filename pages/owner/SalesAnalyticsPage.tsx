import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSalesByDate } from '../../services/mockApi';
import type { Order } from '../../types';

const SalesAnalyticsPage: React.FC = () => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSales = useCallback(async (date: string) => {
        setLoading(true);
        setError('');
        try {
            const data = await getSalesByDate(date);
            setOrders(data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch sales data for the selected date.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSales(selectedDate);
    }, [selectedDate, fetchSales]);

    const stats = useMemo(() => {
        const total = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        return {
            count: orders.length,
            revenue: total
        };
    }, [orders]);

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-200">Sales Report 📊</h1>
                    <p className="text-gray-400 mt-1">Detailed date-wise analytics for collected orders.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-gray-800 p-2 rounded-xl border border-gray-700">
                    <label htmlFor="date-picker" className="text-xs font-black uppercase text-indigo-400 ml-2">Select Date:</label>
                    <input 
                        id="date-picker"
                        type="date" 
                        value={selectedDate}
                        max={today}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-gray-900 text-white p-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                        onClick={() => fetchSales(selectedDate)}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Refresh"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-indigo-600 rounded-3xl p-8 shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 group-hover:scale-110 transition-transform">💰</div>
                    <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-1">Total Revenue</p>
                    <h2 className="text-5xl font-black text-white">₹{stats.revenue.toLocaleString()}</h2>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 group-hover:scale-110 transition-transform">📦</div>
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Total Collected Orders</p>
                    <h2 className="text-5xl font-black text-white">{stats.count}</h2>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-gray-800 border border-gray-700 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-gray-200 uppercase tracking-tighter">Daily Transactions - {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                </div>

                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 mx-auto"></div>
                        <p className="text-gray-500 mt-4 font-bold uppercase tracking-widest text-xs">Fetching Sales Data...</p>
                    </div>
                ) : orders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Time</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Order ID</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Items</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                                            {order.collectedAt ? new Date(order.collectedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">#{order.id.slice(-8).toUpperCase()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-200">{order.studentName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-base font-black text-indigo-400">₹{order.totalAmount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 text-center">
                        <span className="text-6xl block mb-4 grayscale opacity-20">🛒</span>
                        <p className="text-gray-500 font-medium italic">No sales recorded on this date.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesAnalyticsPage;