import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import type { Order, CartItem, MenuItem } from '../../types';
import { OrderStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getStudentOrders, getMenu } from '../../services/mockApi';

const getCartFromStorage = (): CartItem[] => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
};

const saveCartToStorage = (cart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

const getStatusDisplay = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return { text: 'Preparing', icon: '⏳', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' };
    case OrderStatus.PREPARED:
      return { text: 'Ready for Pickup', icon: '✅', className: 'bg-blue-500/20 text-blue-300 border-blue-400/30' };
    case OrderStatus.PARTIALLY_COLLECTED:
      return { text: 'Partially Collected', icon: '📦', className: 'bg-orange-500/20 text-orange-300 border-orange-400/30' };
    case OrderStatus.COLLECTED:
    case OrderStatus.COMPLETED:
      return { text: 'Fully Collected', icon: '🏁', className: 'bg-green-500/20 text-green-300 border-green-400/30' };
    case OrderStatus.CANCELLED:
      return { text: 'Cancelled', icon: '❌', className: 'bg-red-500/20 text-red-300 border-red-400/30' };
    default:
      return { text: status, icon: '❓', className: 'bg-gray-500/20 text-gray-300 border-gray-400/30' };
  }
};

const OrderCard: React.FC<{ order: Order; }> = ({ order }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const statusInfo = getStatusDisplay(order.status);
    const isScreenOrder = order.items.some(i => i.category === 'game');
    const isFinished = order.status === OrderStatus.COLLECTED || order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED;

    const qrValue = JSON.stringify({ type: 'ORDER_QR', token: order.qrToken });
    
    return (
        <div className="bg-surface backdrop-blur-lg border border-surface-light rounded-2xl shadow-md overflow-hidden transition-all duration-300 mb-4 text-textPrimary">
            <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-surface-light/30" onClick={() => setIsExpanded(!isExpanded)}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${isScreenOrder ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300' : 'border-amber-500/50 bg-amber-500/20 text-amber-300'}`}>
                            {isScreenOrder ? '🎬 Screen' : '🍔 Food'}
                        </span>
                    </div>
                    <p className="font-bold font-heading text-lg uppercase tracking-tighter">#{order.id.slice(-6)}</p>
                    <p className="text-[10px] text-textSecondary uppercase font-bold">
                        {order.timestamp && !isNaN(new Date(order.timestamp).getTime())
                            ? new Date(order.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : 'Booking Time Slot'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <p className="font-black font-heading text-xl text-primary">₹{order.totalAmount.toFixed(0)}</p>
                    <div className={`p-1.5 rounded-full bg-white/5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 bg-black/20 border-t border-surface-light animate-fade-in-down">
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-grow">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Item Status</h4>
                            <div className="space-y-2">
                                {order.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-xs">
                                        <p className="text-gray-200">
                                            {item.isDelivered ? '✅ Collected:' : '⏳ Pending:'} {item.name} <span className="text-gray-500 ml-1">x{item.quantity}</span>
                                        </p>
                                        <p className="text-indigo-400 font-bold">₹{(item.price * item.quantity).toFixed(0)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-shrink-0 sm:w-40 text-center sm:border-l sm:border-white/5 sm:pl-6">
                            <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${statusInfo.className}`}>
                                {statusInfo.icon} {statusInfo.text}
                            </div>
                            {!isFinished && (
                                <div className="mt-4 flex flex-col items-center">
                                    <div className="p-2 bg-white rounded-lg shadow-lg border-2 border-indigo-500"><QRCodeSVG value={qrValue} size={90} /></div>
                                    <p className="text-[8px] text-gray-500 mt-2 font-bold uppercase">Ready to Scan</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const OrderHistoryPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'food' | 'game'>('all');
    const { user, loading: authLoading, promptForPhone } = useAuth();
    
    useEffect(() => { if (!authLoading && !user) promptForPhone(); }, [user, authLoading, promptForPhone]);

    const fetchOrders = useCallback(async () => {
        if (user) {
            setLoading(true);
            try {
                const data = await getStudentOrders(user.id);
                setOrders(data);
            } catch (error) { console.error("History fetch failed", error); } 
            finally { setLoading(false); }
        }
    }, [user]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);
    
    const filteredOrders = useMemo(() => orders.filter(order => {
        if (filter === 'all') return true;
        const isScreenOrder = order.items.some(i => i.category === 'game');
        return filter === 'game' ? isScreenOrder : !isScreenOrder;
    }), [orders, filter]);

    if (loading || !user) return <div className="space-y-4 animate-pulse"><div className="h-20 bg-surface rounded-2xl"></div><div className="h-20 bg-surface rounded-2xl"></div></div>;

    return (
        <div className="pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-black font-heading text-textPrimary tracking-tight uppercase">My Orders 🧾</h1>
                <div className="flex bg-white/5 p-1 rounded-full border border-white/5">
                    {['all', 'food', 'game'].map(f => (
                        <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-background' : 'text-gray-500 hover:text-white'}`}>{f}</button>
                    ))}
                </div>
            </div>
            {filteredOrders.length > 0 ? (
                <div className="animate-fade-in-up">{filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}</div>
            ) : <div className="text-center py-20 bg-surface/50 border border-surface-light rounded-[2.5rem]"><p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No orders yet</p></div>}
        </div>
    );
};

export default OrderHistoryPage;