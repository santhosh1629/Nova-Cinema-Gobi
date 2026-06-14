
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Order, SalesSummary, StudentPoints, TodaysDashboardStats, User, StaffRoleType } from '../../types';
import { OrderStatus, Role } from '../../types';
import { 
    getOwnerOrders, updateOrderStatus, getSalesSummary, 
    getMostSellingItems, getOrderStatusSummary, getStudentPointsList, getTodaysDashboardStats, getTodaysDetailedReport,
    getScanTerminalStaff, addStaffMember, updateStaffMember, deleteStaffMember
} from '../../services/mockApi';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';

// For xlsx library loaded from CDN
declare const XLSX: any;

type DashboardTab = 'live' | 'analytics' | 'management' | 'history' | 'staff';

// --- Reusable Components & Icons ---

const ConnectionStatus: React.FC<{ isLive?: boolean }> = ({ isLive }) => (
    <div className={`flex items-center gap-2 px-3 py-1 ${isLive ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} border rounded-full transition-colors`}>
        <span className="relative flex h-2 w-2">
            {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </span>
        <span className={`text-[10px] font-bold ${isLive ? 'text-green-400' : 'text-red-400'} uppercase tracking-widest`}>
            {isLive ? 'Realtime Connected' : 'Connecting...'}
        </span>
    </div>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="group-hover:rotate-180 transition-transform duration-500">
        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658a.25.25 0 0 1-.41-.192z"/>
    </svg>
);

const getStatusBadgeClass = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING: return 'bg-yellow-500/20 text-yellow-300';
    case OrderStatus.PREPARED: return 'bg-blue-500/20 text-blue-300';
    case OrderStatus.PARTIALLY_COLLECTED: return 'bg-orange-500/20 text-orange-300';
    case OrderStatus.COLLECTED:
    case OrderStatus.COMPLETED: return 'bg-emerald-500/20 text-emerald-300';
    case OrderStatus.CANCELLED: return 'bg-red-500/20 text-red-300';
    default: return 'bg-gray-500/20 text-gray-300';
  }
};

const PIE_COLORS = ['#fbbf24', '#60a5fa', '#4ade80', '#c084fc', '#f87171'];

const ScreenTimerDisplay: React.FC<{ endTime: string }> = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState('');
    
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const end = new Date(endTime).getTime();
            const distance = end - now;
            
            if (distance > 0) {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            } else {
                setTimeLeft('DONE');
                clearInterval(interval);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [endTime]);

    return (
        <span className={`font-mono font-bold px-2 py-1 rounded text-xs ${timeLeft === 'DONE' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-300'}`}>
            {timeLeft === 'DONE' ? 'TIME UP' : timeLeft}
        </span>
    );
};

// --- Tab Components ---

const DailyStats: React.FC<{ stats: TodaysDashboardStats, isLive: boolean }> = ({ stats, isLive }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadReport = async () => {
        setIsDownloading(true);
        try {
            const reportData = await getTodaysDetailedReport();
            const summaryData = [["Daily Report Summary"], [], ["Date", reportData.date], ["Total Orders", reportData.totalOrders], ["Total Income (₹)", reportData.totalIncome.toFixed(2)]];
            const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
            const itemSalesData = [["Item Name", "Quantity Sold", "Total Price (₹)"], ...reportData.itemSales.map(item => [item.name, item.quantity, item.totalPrice])];
            const wsItems = XLSX.utils.aoa_to_sheet(itemSalesData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
            XLSX.utils.book_append_sheet(wb, wsItems, "Item-wise Sales");
            XLSX.writeFile(wb, `Daily_Report_${reportData.date}.xlsx`);
        } catch (error) { console.error("Failed to generate report", error); } 
        finally { setIsDownloading(false); }
    };

    return (
        <div className="mb-6">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-gray-200">Today's Performance</h2>
                    <ConnectionStatus isLive={isLive} />
                </div>
                <button onClick={handleDownloadReport} disabled={isDownloading} className="bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 hover:bg-gray-600 disabled:opacity-50">
                    📂 {isDownloading ? 'Downloading...' : 'Daily Export'}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4 border border-gray-700">
                     <div className="bg-indigo-500/20 text-indigo-400 p-4 rounded-full text-3xl">📦</div>
                     <div><p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Total Orders</p><p className="text-3xl font-bold text-white">{stats.totalOrders}</p></div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4 border border-gray-700">
                    <div className="bg-green-500/20 text-green-300 p-4 rounded-full text-3xl">💰</div>
                     <div><p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Total Income</p><p className="text-3xl font-bold text-white">₹{stats.totalIncome.toFixed(2)}</p></div>
                </div>
                <div className="md:col-span-2 lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 overflow-hidden">
                    <h3 className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-3">Popular Items Today</h3>
                     {stats.itemsSold.length > 0 ? (
                        <ul className="space-y-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin">
                            {stats.itemsSold.map(item => (
                                <li key={item.name} className="flex justify-between text-sm"><span className="text-gray-300">{item.name}</span><span className="font-bold text-white">x{item.quantity}</span></li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-400">No sales yet.</p>}
                </div>
            </div>
        </div>
    );
};

const OrdersManager: React.FC<{orders: Order[], onRefresh: () => void, onViewOrder: (order: Order) => void, isRefreshing: boolean}> = ({ orders, onRefresh, onViewOrder, isRefreshing }) => {
    const [showOnlyPending, setShowOnlyPending] = useState(false);
    
    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            onRefresh();
        } catch (error) { console.error("Failed to update status:", error); }
    };
    
    const activeOrders = useMemo(() => 
        orders
            .filter(o => o.status !== OrderStatus.COLLECTED && o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), 
        [orders]
    );

    const displayedOrders = showOnlyPending ? activeOrders.filter(o => o.status === OrderStatus.PENDING) : activeOrders;

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-200">Current Orders 🛎️</h2>
                    <button 
                        onClick={onRefresh} 
                        disabled={isRefreshing}
                        className={`group flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <RefreshIcon /> {isRefreshing ? 'Refreshing...' : '🔄 Refresh Queue'}
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="pending-toggle" className="text-sm font-medium text-gray-400 cursor-pointer">Only Pending</label>
                    <button id="pending-toggle" onClick={() => setShowOnlyPending(!showOnlyPending)} className={`${showOnlyPending ? 'bg-indigo-600' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none`} role="switch">
                        <span className={`${showOnlyPending ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/></button>
                </div>
            </div>

            {displayedOrders.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {displayedOrders.map(order => {
                                const isScreenActive = (order.status === OrderStatus.COLLECTED || order.status === OrderStatus.PENDING) && order.items.some(i => i.category === 'game');
                                return (
                                <tr key={order.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500 uppercase">#{order.id.slice(-6)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm align-top">
                                        <div className="font-bold text-gray-200">{order.studentName}</div>
                                        {order.customerPhone ? (
                                            <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1 mt-0.5 text-indigo-400 hover:text-indigo-300 font-mono font-medium transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                                                </svg>
                                                {order.customerPhone}
                                            </a>
                                        ) : (
                                            <div className="text-xs text-gray-500 italic mt-0.5">Phone not available</div>
                                        )}
                                        {order.seatNumber && <div className="mt-2 text-xs font-black text-amber-400 uppercase tracking-tighter bg-amber-500/10 px-2 py-0.5 rounded inline-block">Location: {order.seatNumber}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-400 align-top">
                                        <ul className="space-y-1">
                                            {order.items.map(i => (
                                                <li key={i.id + (i.selectedSlotId || '')} className="flex items-center gap-2">
                                                    <span className={i.isDelivered ? 'line-through opacity-50' : 'font-semibold text-white'}>{i.name} x{i.quantity}</span>
                                                    {i.isDelivered && <span className="text-[10px] text-green-500 font-bold uppercase">Served</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap align-top">
                                        <span className={`px-2 inline-flex text-[10px] font-black uppercase tracking-widest rounded-full ${getStatusBadgeClass(order.status)}`}>{order.status.replace('_', ' ')}</span>
                                        {isScreenActive && order.gameEndTime && <div className="mt-2"><ScreenTimerDisplay endTime={order.gameEndTime} /></div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => onViewOrder(order)} className="text-gray-400 hover:text-white transition-colors">👁️ View</button>
                                            {order.status === OrderStatus.PENDING && 
                                                <button onClick={() => handleStatusUpdate(order.id, OrderStatus.PREPARED)} className="bg-blue-600 text-white font-bold py-1 px-3 rounded text-xs hover:bg-blue-500">Ready</button>
                                            }
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            ) : <div className="text-center py-12"><p className="text-gray-500 italic">No active orders pending collection.</p></div>}
        </div>
    );
};

const StaffManager: React.FC<{ staff: User[], onRefresh: () => void }> = ({ staff, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        role: 'qr_scanner' as StaffRoleType,
        password: '',
        isActive: true
    });

    const openModal = (member?: User) => {
        if (member) {
            setEditingStaff(member);
            setFormData({
                name: member.username,
                phone: member.phone || '',
                role: member.staffRole || 'qr_scanner',
                password: member.password || '',
                isActive: member.isActiveProfile ?? true
            });
        } else {
            setEditingStaff(null);
            setFormData({
                name: '',
                phone: '',
                role: 'qr_scanner',
                password: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingStaff) {
                await updateStaffMember(editingStaff.id, formData);
            } else {
                await addStaffMember(formData);
            }
            setIsModalOpen(false);
            onRefresh();
            window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: `Staff ${editingStaff ? 'updated' : 'added'}!` } }));
        } catch (err) {
            alert((err as Error).message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this staff member?')) return;
        try {
            await deleteStaffMember(id);
            onRefresh();
        } catch (err) {
            alert((err as Error).message);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-200">Staff Management 👥</h2>
                <button onClick={() => openModal()} className="bg-indigo-600 text-white font-black py-2 px-4 rounded-full text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all">
                    + Add Staff
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Login ID</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {staff.map(member => (
                            <tr key={member.id} className="hover:bg-white/5">
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-200">{member.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 uppercase tracking-tight">{member.staffRole?.replace('_', ' ')}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-indigo-400">{member.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${member.isActiveProfile ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {member.isActiveProfile ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold space-x-3">
                                    <button onClick={() => openModal(member)} className="text-gray-400 hover:text-white uppercase tracking-tighter">Edit</button>
                                    <button onClick={() => handleDelete(member.id)} className="text-red-500 hover:text-red-400 uppercase tracking-tighter">Remove</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl animate-pop-in">
                        <h2 className="text-xl font-black text-white uppercase mb-6">{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Full Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Login Mobile Number</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Staff Role</label>
                                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as StaffRoleType})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none appearance-none">
                                    <option value="manager" className="bg-gray-900">Manager</option>
                                    <option value="qr_scanner" className="bg-gray-900">QR Scanner</option>
                                    <option value="counter" className="bg-gray-900">Counter</option>
                                    <option value="delivery" className="bg-gray-900">Delivery</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Account Password</label>
                                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" required />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="is_active" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 rounded-lg accent-indigo-600" />
                                <label htmlFor="is_active" className="text-sm font-bold text-gray-300">Staff Account is Active</label>
                            </div>
                            
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-white">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/30">Save Member</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const AnalyticsView: React.FC<{ salesSummary: SalesSummary; mostSellingItems: { name: string; count: number }[]; orderStatusSummary: { name: string; value: number }[]; }> = ({ salesSummary, mostSellingItems, orderStatusSummary }) => (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="font-bold mb-4 text-gray-200">Weekly Sales</h3>
            <ResponsiveContainer width="100%" height={300}><BarChart data={salesSummary.weekly}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis dataKey="week" tick={{ fill: '#CBD5E0' }} /><YAxis tick={{ fill: '#CBD5E0' }} /><Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} /><Legend /><Bar dataKey="total" fill="#6366F1" name="Sales (₹)" /></BarChart></ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="font-bold mb-4 text-gray-200">Order Mix</h3>
            <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={orderStatusSummary} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{orderStatusSummary.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} /><Legend /></PieChart></ResponsiveContainer>
        </div>
    </div>
);

const OrderHistoryView: React.FC<{ orders: Order[] }> = ({ orders }) => {
    const [filter, setFilter] = useState<'all' | OrderStatus>('all');
    const historyOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.COLLECTED || o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED), [orders]);
    const filteredOrders = useMemo(() => filter === 'all' ? historyOrders : historyOrders.filter(o => o.status === filter), [historyOrders, filter]);

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-200 uppercase tracking-widest text-xs">Collected Order History</h3>
                <select value={filter} onChange={e => setFilter(e.target.value as any)} className="bg-gray-700 border border-gray-600 text-white text-xs rounded-md p-1.5 focus:outline-none">
                    <option value="all">All Finished</option>
                    <option value={OrderStatus.COLLECTED}>Collected</option>
                    <option value={OrderStatus.CANCELLED}>Cancelled</option>
                </select>
            </div>
            <div className="overflow-x-auto max-h-[60vh] scrollbar-thin pr-2">
                {filteredOrders.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50 sticky top-0"><tr><th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Order</th><th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Customer</th><th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Total</th><th className="px-4 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Status</th></tr></thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-700/20">
                                    <td className="px-4 py-3 text-xs font-mono text-gray-500 uppercase">#{order.id.slice(-6)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-200">{order.studentName}</td>
                                    <td className="px-4 py-3 text-sm font-black text-indigo-400">₹{order.totalAmount.toFixed(0)}</td>
                                    <td className="px-4 py-3 text-right"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusBadgeClass(order.status)}`}>{order.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-center text-gray-500 py-8 italic">No collected records found.</p>}
            </div>
        </div>
    );
};

export const OwnerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState<DashboardTab>('live');

    const [orders, setOrders] = useState<Order[]>([]);
    const [salesSummary, setSalesSummary] = useState<SalesSummary>({ daily: [], weekly: [] });
    const [mostSellingItems, setMostSellingItems] = useState<{ name: string; count: number }[]>([]);
    const [orderStatusSummary, setOrderStatusSummary] = useState<{ name: string; value: number }[]>([]);
    const [customerPoints, setCustomerPoints] = useState<StudentPoints[]>([]);
    const [todaysStats, setTodaysStats] = useState<TodaysDashboardStats>({ totalOrders: 0, totalIncome: 0, itemsSold: [] });
    const [staff, setStaff] = useState<User[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isRealtimeActive, setIsRealtimeActive] = useState(false);

    const fetchData = useCallback(async (isManual = false) => {
        if (!user) return;
        if (isManual) setIsRefreshing(true);
        try {
            /**
             * Fix: Correctly map Promise.all results to destructuring variables.
             * getTodaysDetailedReport() returned index 6 which was incorrectly assigned to staffData.
             * Removed getTodaysDetailedReport() from the array since it's not stored in state here.
             */
            const [ordersData, salesData, sellingItemsData, statusSummaryData, pointsData, todaysStatsData, staffData] = await Promise.all([
                getOwnerOrders(), getSalesSummary(), getMostSellingItems(), getOrderStatusSummary(), getStudentPointsList(), getTodaysDashboardStats(), getScanTerminalStaff()
            ]);
            setOrders(ordersData); setSalesSummary(salesData); setMostSellingItems(sellingItemsData); setOrderStatusSummary(statusSummaryData); setCustomerPoints(pointsData); setTodaysStats(todaysStatsData); setStaff(staffData);
        } catch (error) {
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
            if (isManual) setIsRefreshing(false);
        }
    }, [user]);

    // Initial Fetch
    useEffect(() => { fetchData(); }, [fetchData]);

    // SPEED-UP: Realtime Subscription logic
    useEffect(() => {
        if (!user) return;

        console.log("🚀 Initializing Realtime Subscriptions for snappier process...");
        
        const ordersChannel = supabase
            .channel('dashboard-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => {
                    console.log("⚡ Change detected in orders table:", payload.eventType);
                    // Fetch everything again on any change for 100% accuracy, 
                    // but we do it instantly instead of waiting 20s.
                    fetchData();
                    
                    if (payload.eventType === 'INSERT') {
                        window.dispatchEvent(new CustomEvent('show-owner-toast', { 
                            detail: { message: '🔥 NEW ORDER RECEIVED!' } 
                        }));
                        // Play a snappy sound if needed here
                    }
                }
            )
            .subscribe((status) => {
                console.log("🛰️ Realtime status:", status);
                setIsRealtimeActive(status === 'SUBSCRIBED');
            });

        return () => {
            supabase.removeChannel(ordersChannel);
        };
    }, [user, fetchData]);

    const TabButton: React.FC<{ tab: DashboardTab, label: string }> = ({ tab, label }) => (
        <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-black uppercase tracking-widest text-[10px] rounded-full transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}>
            {label}
        </button>
    );

    return (
        <div className="space-y-8 pb-20">
            {viewingOrder && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewingOrder(null)}>
                    <div className="bg-gray-900 p-8 rounded-3xl border border-white/10 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewingOrder(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-2xl font-bold">&times;</button>
                        <h2 className="text-xl font-black text-white uppercase mb-6 tracking-tight">Order Insight</h2>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                            <div className="bg-white/5 p-4 rounded-xl">
                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Customer</p>
                                <p className="font-bold text-lg text-white">{viewingOrder.studentName}</p>
                                {viewingOrder.customerPhone ? (
                                    <a href={`tel:${viewingOrder.customerPhone}`} className="text-sm text-indigo-400 hover:underline flex items-center gap-2 mt-1">
                                        📞 {viewingOrder.customerPhone}
                                    </a>
                                ) : (
                                    <p className="text-sm text-gray-500 italic mt-1">Phone not available</p>
                                )}
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl">
                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Cart Contents</p>
                                <ul className="space-y-2">
                                    {viewingOrder.items.map(i => (
                                        <li key={i.id} className="flex justify-between border-b border-white/5 pb-2 text-sm">
                                            <span>{i.name} x{i.quantity}</span>
                                            <span className="font-bold text-indigo-400">₹{i.price.toFixed(0)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 pt-4 flex justify-between font-black text-white uppercase border-t border-white/10"><span>Total Value</span><span>₹{viewingOrder.totalAmount.toFixed(0)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {loading ? (
                 <div className="flex flex-col items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 mb-4"></div><p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Loading Dashboard...</p></div>
            ) : (
                <>
                    <DailyStats stats={todaysStats} isLive={isRealtimeActive} />
                    <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-2 rounded-full flex flex-wrap gap-2 mb-6 sticky top-20 z-10 w-fit">
                        <TabButton tab="live" label="Live Queue" />
                        <TabButton tab="staff" label="Staff" />
                        <TabButton tab="history" label="Collected History" />
                        <TabButton tab="analytics" label="Analytics" />
                    </div>
                    {activeTab === 'live' && <div className="animate-fade-in-up"><OrdersManager orders={orders} onRefresh={() => fetchData(true)} onViewOrder={setViewingOrder} isRefreshing={isRefreshing} /></div>}
                    {activeTab === 'staff' && <div className="animate-fade-in-up"><StaffManager staff={staff} onRefresh={() => fetchData(true)} /></div>}
                    {activeTab === 'history' && <div className="animate-fade-in-up"><OrderHistoryView orders={orders} /></div>}
                    {activeTab === 'analytics' && <div className="animate-fade-in-up"><AnalyticsView salesSummary={salesSummary} mostSellingItems={mostSellingItems} orderStatusSummary={orderStatusSummary} /></div>}
                </>
            )}
        </div>
    );
};
