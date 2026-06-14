
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CartItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { placeOrder, createPaymentRecord, checkSlotAvailability } from '../../services/mockApi';

declare const Razorpay: any;

const getCartFromStorage = (): CartItem[] => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
};

const saveCartToStorage = (cart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

const formatToKolkataTime = (date: Date): string => {
    if (isNaN(date.getTime())) return '10:00 AM';
    return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const CartPage: React.FC = () => {
    const [cart, setCart] = useState<CartItem[]>(getCartFromStorage());
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    
    // Force re-render every minute to keep time current
    const [, setTick] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(timer);
    }, []);
    
    const { user, loading, promptForPhone, updateUser } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
    const [customerName, setCustomerName] = useState(user?.username || '');
    const [seatNumber, setSeatNumber] = useState('');
    const [validationError, setValidationError] = useState('');
    
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            promptForPhone();
        }
    }, [user, loading, promptForPhone]);
    
    useEffect(() => {
        if (user) {
            if (user.phone) setPhoneNumber(user.phone);
            if (user.username) setCustomerName(user.username);
        }
    }, [user]);

    const updateCart = (newCart: CartItem[]) => {
        setCart(newCart);
        saveCartToStorage(newCart);
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    };

    const getItemUniqueKey = (item: CartItem) => {
        return item.id + (item.selectedSlotId || '') + (item.selectedStartTime || '');
    };

    const handleQuantityChange = (itemKey: string, newQuantity: number) => {
        if (newQuantity < 1) handleRemoveItem(itemKey);
        else updateCart(cart.map(item => getItemUniqueKey(item) === itemKey ? { ...item, quantity: newQuantity } : item));
    };
    
    const handleRemoveItem = (itemKey: string) => updateCart(cart.filter(item => getItemUniqueKey(item) !== itemKey));
    
    const handleNotesChange = (itemKey: string, notes: string) => updateCart(cart.map(item => getItemUniqueKey(item) === itemKey ? { ...item, notes } : item));
    
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
    
    const totalAmount = subtotal;

    const handleRealOrderPlacement = async (paymentId: string) => {
        if (!user) return;

        if (user.phone !== phoneNumber) {
            try {
                await updateUser({ phone: phoneNumber });
            } catch (updateError) {
                console.error("Failed to update phone number:", updateError);
            }
        }

        try {
            const orderPayload = {
                studentId: user.id, 
                studentName: customerName,
                customerPhone: phoneNumber,
                items: cart.map(({ id, name, quantity, price, notes, imageUrl, category, selectedSlotId, durationMinutes, selectedStartTime }) => ({ 
                    id, 
                    name, 
                    quantity, 
                    price, 
                    notes, 
                    imageUrl, 
                    category: category ? category.toLowerCase() : 'food', 
                    selectedSlotId, 
                    durationMinutes, 
                    selectedStartTime
                })),
                totalAmount,
                seatNumber: seatNumber,
            };
            const order = await placeOrder(orderPayload);
            await createPaymentRecord({
                order_id: order.id,
                student_id: user.id,
                amount: totalAmount,
                method: 'Razorpay',
                status: 'successful',
                transaction_id: paymentId,
            });
            updateCart([]);
            navigate(`/customer/order-success/${order.id}`, { state: { showSuccessToast: true } });
        } catch (error) {
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: (error as Error).message, type: 'payment-error' } }));
            setIsPlacingOrder(false);
        }
    };
    
    const handlePayment = async () => {
        if (!phoneNumber.trim() || !seatNumber.trim() || !customerName.trim()) {
            setValidationError('Please fill in all details (Name, Phone, Screen Number).');
            return;
        }
        if (!/^\d{10}$/.test(phoneNumber)) {
            setValidationError('Please enter a valid 10-digit phone number.');
            return;
        }
        
        setValidationError('');
        setIsPlacingOrder(true);

        const gameItems = cart.filter(i => i.category === 'game');
        for (const item of gameItems) {
            if (item.selectedSlotId && item.selectedStartTime) {
                const check = await checkSlotAvailability(item.id, item.selectedSlotId, item.selectedStartTime, item.durationMinutes || 60);
                if (!check.isAvailable) {
                    setIsPlacingOrder(false);
                    const msg = `Booking Failed: ${item.name} (${item.selectedSlotId}) was just booked by someone else for your selected time.`;
                    setValidationError(msg);
                    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: msg, type: 'cart-warn' } }));
                    return;
                }
            }
        }

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_T1TvGeupoBpBxZ', 
            amount: totalAmount * 100, 
            currency: "INR",
            name: "NOVA CINEMA GOBI",
            description: "Theater/Food Order Payment",
            image: "/favicon.ico",
            handler: (response: { razorpay_payment_id: string }) => {
                handleRealOrderPlacement(response.razorpay_payment_id);
            },
            prefill: {
                name: customerName,
                email: user?.email || '',
                contact: phoneNumber,
            },
            theme: {
                color: "#D4AF37",
            },
            modal: {
                ondismiss: () => {
                    setIsPlacingOrder(false);
                    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Payment was cancelled.', type: 'cart-warn' } }));
                }
            }
        };
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
             window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Payment Failed: ${response.error.description}`, type: 'payment-error' } }));
            console.error('Razorpay Error:', response.error);
            setIsPlacingOrder(false);
        });
        rzp.open();
    };


    if (!user) {
        return <div className="text-center py-16 text-textPrimary"><p>Please log in to view your cart.</p></div>;
    }


    return (
        <div className="text-textPrimary">
            <h1 className="text-3xl font-bold font-heading mb-6" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                Your Cart 🛒
            </h1>
            {cart.length === 0 ? (
                <div className="text-center py-16 bg-surface/50 backdrop-blur-lg border border-surface-light rounded-lg shadow-md">
                    <p className="text-xl font-semibold">Your cart is empty.</p>
                    <p className="text-textSecondary mt-2">Looks like you haven't added anything yet!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map((item, idx) => {
                            let startTimeStr = 'Now';
                            let endTimeStr = '';
                            const duration = item.durationMinutes || 60;
                            const itemKey = getItemUniqueKey(item);
                            const isGame = !!(item.category && item.category.toLowerCase() === 'game');

                            if (isGame) {
                                const start = item.selectedStartTime ? new Date(item.selectedStartTime) : new Date();
                                if (isNaN(start.getTime())) {
                                    startTimeStr = '10:00 AM';
                                    endTimeStr = '01:00 PM';
                                } else {
                                    const end = new Date(start.getTime() + duration * 60000);
                                    startTimeStr = formatToKolkataTime(start);
                                    endTimeStr = formatToKolkataTime(end);
                                }
                            }

                            return (
                            <div key={itemKey + idx} className="bg-surface/50 backdrop-blur-lg border border-surface-light rounded-lg p-4 flex gap-4 items-start shadow-md">
                                <img src={item.imageUrl} alt={item.name} className="w-24 h-24 object-cover rounded-md" />
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold font-heading text-lg">{item.name}</h3>
                                    </div>
                                    <p className="font-bold font-heading text-primary">₹{item.price}</p>
                                    
                                    {isGame && item.selectedSlotId && (
                                        <div className="mt-2 mb-2">
                                            <p className="text-sm text-indigo-300 font-bold bg-indigo-500/20 px-2 py-1 rounded inline-block mb-2">
                                                Slot Name: {item.selectedSlotId === 'Hall 1' ? 'Main Lobby Hall' : item.selectedSlotId} ({duration}m)
                                            </p>
                                            <div className="bg-black/40 border border-white/10 rounded-lg p-2 text-sm max-w-[200px]">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-gray-400 text-xs uppercase font-bold">Booked Time</span>
                                                    <span className="text-white font-mono uppercase">{startTimeStr} – {endTimeStr}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-t border-white/10 pt-1">
                                                    <span className="text-gray-400 text-xs uppercase font-bold">Status</span>
                                                    <span className="text-amber-400 font-mono font-bold uppercase text-right">Booked</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        type="text"
                                        placeholder="Add specific instructions..."
                                        value={item.notes || ''}
                                        onChange={(e) => handleNotesChange(itemKey, e.target.value)}
                                        className="w-full text-sm mt-1 px-2 py-1 border border-white/30 bg-black/30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/50"
                                    />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 bg-black/30 rounded-full p-1">
                                        <button onClick={() => handleQuantityChange(itemKey, item.quantity - 1)} className="w-6 h-6 rounded-full bg-primary text-background font-bold flex items-center justify-center">-</button>
                                        <span className="font-bold w-6 text-center">{item.quantity}</span>
                                        <button onClick={() => handleQuantityChange(itemKey, item.quantity + 1)} className="w-6 h-6 rounded-full bg-primary text-background font-bold flex items-center justify-center">+</button>
                                    </div>
                                    <button onClick={() => handleRemoveItem(itemKey)} className="text-xs text-white/70 hover:underline">Remove</button>
                                </div>
                            </div>
                        )})}
                        <div className="bg-surface/50 backdrop-blur-lg border border-surface-light rounded-lg p-4 mt-4 shadow-md space-y-4">
                            <h3 className="font-bold font-heading text-lg">Delivery Details</h3>
                            <div>
                                <label htmlFor="customer-name" className="block text-sm font-semibold text-textSecondary mb-1">Name <span className="text-red-400">*</span></label>
                                <input type="text" id="customer-name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Your Name" required />
                            </div>
                            <div>
                                <label htmlFor="phone-number" className="block text-sm font-semibold text-textSecondary mb-1">Phone Number <span className="text-red-400">*</span></label>
                                <input type="tel" id="phone-number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="10-digit mobile number" required />
                            </div>
                            <div>
                                <label htmlFor="seat-number" className="block text-sm font-semibold text-textSecondary mb-1">Screen Number <span className="text-red-400">*</span></label>
                                <input type="text" id="seat-number" value={seatNumber} onChange={e => setSeatNumber(e.target.value)} className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g., Screen 1 or G14" required />
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface/50 backdrop-blur-lg border border-surface-light rounded-lg p-6 h-fit sticky top-24 shadow-xl">
                        <h2 className="text-2xl font-bold font-heading mb-4">Summary</h2>
                        
                        <div className="space-y-2 pt-4">
                            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold font-heading text-xl pt-2 mt-2 border-t border-white/20"><span>Total</span><span>₹{totalAmount.toFixed(2)}</span></div>
                        </div>

                        {validationError && <p className="text-red-400 text-sm text-center mt-4">{validationError}</p>}

                        <button onClick={handlePayment} disabled={isPlacingOrder || !user || !customerName.trim() || !phoneNumber.trim() || !seatNumber.trim()} className="w-full mt-6 bg-primary text-background font-bold font-heading py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors shadow-lg hover:shadow-primary/50 disabled:bg-primary/50 disabled:cursor-not-allowed">
                            {isPlacingOrder ? 'Processing...' : 'Proceed to Pay'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
