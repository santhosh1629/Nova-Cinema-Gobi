
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import type { Order } from '../../types';
import { OrderStatus } from '../../types';
import { getOrderById, updateOrderSeatNumber } from '../../services/mockApi';
import { supabase } from '../../services/supabaseClient';

// --- Icon Components to match the image ---
const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
);

const ScreenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const OrderSuccessPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [seatNumber, setSeatNumber] = useState('');
    const [seatSubmitted, setSeatSubmitted] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [currentStatus, setCurrentStatus] = useState<OrderStatus | null>(null);

    useEffect(() => {
        if (location.state?.showSuccessToast) {
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Booking Confirmed!', type: 'payment-success' } }));
        }
    }, [location.state]);

    const fetchOrder = async () => {
        if (orderId) {
            try {
                const orderData = await getOrderById(orderId);
                setOrder(orderData);
                setCurrentStatus(orderData.status);
                if (orderData.seatNumber) {
                    setSeatNumber(orderData.seatNumber);
                    setSeatSubmitted(true);
                }
            } catch (error) {
                console.error("Fetch error", error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchOrder();

        if (orderId) {
            const statusChannel = supabase
                .channel(`order-status-${orderId}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
                    (payload) => {
                        const newStatus = payload.new.status as OrderStatus;
                        setCurrentStatus(newStatus);
                        fetchOrder();
                        if (newStatus === OrderStatus.COLLECTED || newStatus === OrderStatus.COMPLETED) {
                            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Order Collected! Enjoy!', type: 'payment-success' } }));
                        }
                    }
                )
                .subscribe();
            return () => { supabase.removeChannel(statusChannel); };
        }
    }, [orderId]);

    const handleSeatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (seatNumber.trim() && orderId) {
            try {
                await updateOrderSeatNumber(orderId, seatNumber.trim());
                setSeatSubmitted(true);
            } catch (error) {
                alert("Retry update.");
            }
        }
    };

    const totalSeats = useMemo(() => {
        return order?.items.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
    }, [order]);

    if (loading) return <div className="max-w-md mx-auto h-[600px] bg-indigo-900/20 rounded-[2.5rem] animate-pulse"></div>;
    if (!order) return <div className="text-center text-red-400 py-20 font-bold uppercase tracking-widest">Ticket not found</div>;

    const isFinished = currentStatus === OrderStatus.COLLECTED || currentStatus === OrderStatus.COMPLETED;
    const qrValue = JSON.stringify({ type: 'ORDER_QR', token: order.qrToken });
    const primaryItem = order.items[0];

    return (
        <div className="max-w-md mx-auto pb-10">
            {/* The Ticket Container */}
            <div className="relative bg-[#4c1d95] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-fade-in-up">
                
                {/* Top Section: Movie/Order Info */}
                <div className="p-8 pb-10">
                    <div className="flex gap-6">
                        {/* Poster Image */}
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-black/40">
                            <img src={primaryItem?.imageUrl} alt={primaryItem?.name} className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Details */}
                        <div className="flex flex-col justify-between py-1">
                            <div>
                                <h1 className="text-white text-xl sm:text-2xl font-black leading-tight uppercase font-logo tracking-tight">
                                    {primaryItem?.name}
                                </h1>
                                <p className="text-gray-300 text-sm font-medium mt-1 uppercase tracking-wider">
                                    {primaryItem?.category === 'game' ? 'Experience' : 'Cinema Order'}
                                </p>
                            </div>
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${isFinished ? 'text-green-400' : 'text-amber-400 animate-pulse'}`}>
                                    {isFinished ? 'Collected' : 'Confirmed'}
                                </p>
                                <div className="inline-block border border-white/50 px-4 py-1.5 rounded-lg text-white font-bold text-sm">
                                    {totalSeats} {totalSeats > 1 ? 'Items' : 'Item'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scalloped Edge / Perforation Section */}
                <div className="relative h-6 flex items-center">
                    {/* Left Cut-out */}
                    <div className="absolute -left-3 w-6 h-6 rounded-full bg-[#020617] z-10 shadow-inner"></div>
                    {/* Dashed Line */}
                    <div className="w-full border-b-2 border-dashed border-white/20 mx-4"></div>
                    {/* Right Cut-out */}
                    <div className="absolute -right-3 w-6 h-6 rounded-full bg-[#020617] z-10 shadow-inner"></div>
                </div>

                {/* Bottom Section: Order Details & QR */}
                <div className="p-8 pt-10 space-y-6">
                    {/* Icon rows */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-4 text-white">
                            <div className="text-gray-300"><TicketIcon /></div>
                            <p className="font-medium tracking-wide">Order Number: <span className="font-mono font-bold text-gray-200">{order.id.slice(-6).toUpperCase()}</span></p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-white">
                            <div className="text-gray-300"><ScreenIcon /></div>
                            <p className="font-medium tracking-wide">Nova Cinema Gobi • <span className="text-gray-200 font-bold">{order.seatNumber || 'N/A'}</span></p>
                        </div>

                        <div className="flex items-center gap-4 text-white">
                            <div className="text-gray-300"><LocationIcon /></div>
                            <p className="font-medium tracking-wide">Main Lobby Hall</p>
                        </div>

                        <div className="flex items-center gap-4 text-white">
                            <div className="text-gray-300"><CalendarIcon /></div>
                            <p className="font-medium tracking-wide">
                                {order.timestamp && !isNaN(new Date(order.timestamp).getTime())
                                    ? new Date(order.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'Booking Time Slot'}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-white">
                            <div className="text-gray-300"><ClockIcon /></div>
                            <p className="font-medium tracking-wide">
                                {order.timestamp && !isNaN(new Date(order.timestamp).getTime())
                                    ? new Date(order.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                                    : '10:00 AM – 01:00 PM'}
                            </p>
                        </div>
                    </div>

                    {/* QR Code Embedded in stub */}
                    <div className="mt-10 flex flex-col items-center">
                        <div className={`p-4 bg-white rounded-3xl border-4 ${isFinished ? 'border-green-500/50 grayscale opacity-50' : 'border-indigo-400 shadow-[0_0_30px_rgba(255,255,255,0.2)]'}`}>
                            <QRCode value={qrValue} size={160} fgColor="#000000" bgColor="#FFFFFF" />
                        </div>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-6 text-center">
                           {isFinished ? "ALREADY SCANNED" : "SCAN AT COUNTER"}
                        </p>
                    </div>

                    {/* Seat Number Update Form (If missing) */}
                    {!seatSubmitted && !isFinished && (
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <form onSubmit={handleSeatSubmit} className="space-y-4">
                                <label className="block text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">Entry Detail Needed</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={seatNumber} 
                                        onChange={(e) => setSeatNumber(e.target.value)} 
                                        placeholder="SCREEN #" 
                                        className="flex-grow text-center text-xl font-black py-3 bg-black/40 border-2 border-white/10 rounded-xl focus:border-white transition-all uppercase text-white" 
                                        required 
                                    />
                                    <button type="submit" className="bg-white text-black font-black px-6 rounded-xl uppercase text-xs active:scale-95 transition-transform">Save</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Footer Bar */}
                <div className="bg-black/20 py-4 px-8 flex justify-between items-center border-t border-white/5">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Total Amount</span>
                    <span className="text-xl font-logo font-black text-amber-400">₹{order.totalAmount.toFixed(0)}</span>
                </div>
            </div>

            {/* Back Button */}
            <button 
                onClick={() => navigate('/customer/games')}
                className="w-full mt-8 py-4 text-gray-500 font-black uppercase tracking-[0.3em] text-[10px] hover:text-white transition-colors"
            >
                Return to Screens
            </button>
        </div>
    );
};

export default OrderSuccessPage;
