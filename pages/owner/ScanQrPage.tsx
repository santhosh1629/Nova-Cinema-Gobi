
import React, { useState, useEffect } from 'react';
import { verifyQrCode, updatePartialDelivery } from '../../services/mockApi';
import type { Order } from '../../types';
import { OrderStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

declare const Html5QrcodeScanner: any;

const ScanQrPage: React.FC = () => {
    const { user } = useAuth();
    const [scanResult, setScanResult] = useState<'idle' | 'verifying' | 'showing-order' | 'success' | 'error'>('idle');
    const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (scanResult !== 'idle') return;

        const scanner = new Html5QrcodeScanner(
            "reader",
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            false
        );

        const onScanSuccess = (decodedText: string) => {
            console.log("RAW_QR_SCANNED:", decodedText);
            scanner.clear().then(() => {
                handleProcessScanResult(decodedText);
            }).catch(e => {
                console.error("Scanner clear failed", e);
                handleProcessScanResult(decodedText);
            });
        };

        scanner.render(onScanSuccess, (err: any) => {
            // Silence noise from failed frame reads
        });

        return () => {
            if (document.getElementById('reader')) {
                scanner.clear().catch(() => {});
            }
        };
    }, [scanResult]);

    const handleProcessScanResult = async (rawText: string) => {
        setScanResult('verifying');
        let orderToken = '';

        try {
            if (rawText.startsWith('{')) {
                const data = JSON.parse(rawText);
                if (data.type === 'ORDER_QR' && data.token) {
                    orderToken = data.token;
                } else {
                    throw new Error("Format Mismatch");
                }
            } else {
                orderToken = rawText.trim();
            }

            if (!orderToken) throw new Error("Empty Token");

            const order = await verifyQrCode(orderToken);
            setScannedOrder(order);
            
            const allDelivered = order.items.every(i => i.isDelivered);
            if (allDelivered || order.status === OrderStatus.COLLECTED) {
                setScanResult('success');
            } else {
                setScanResult('showing-order');
                setSelectedItemIds(new Set());
            }
        } catch (err) {
            console.error("SCAN_ERROR:", err);
            const msg = (err as Error).message;
            if (msg.includes("Unexpected token") || msg === "Format Mismatch") {
                setErrorMessage("Invalid Code. Please scan a valid Nova Cinema Gobi QR.");
            } else if (msg === "Order not found") {
                setErrorMessage("No record found for this QR.");
            } else {
                setErrorMessage(msg || "Scan Failed");
            }
            setScanResult('error');
        }
    };

    const handleToggleItem = (itemId: string) => {
        setSelectedItemIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) newSet.delete(itemId);
            else newSet.add(itemId);
            return newSet;
        });
    };

    const handleSubmitDelivery = async () => {
        if (!scannedOrder || selectedItemIds.size === 0 || !user) return;
        
        setIsSubmitting(true);
        try {
            const updated = await updatePartialDelivery(scannedOrder.id, Array.from(selectedItemIds), user.id);
            setScannedOrder(updated);
            
            if (updated.status === OrderStatus.COLLECTED) {
                setScanResult('success');
                window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: 'Order fully collected!' } }));
            } else {
                setSelectedItemIds(new Set());
                window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: 'Items delivered!' } }));
            }
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setScanResult('idle');
        setScannedOrder(null);
        setSelectedItemIds(new Set());
        setErrorMessage('');
    };

    const renderScanner = () => (
        <div className="w-full text-center">
            <div id="reader" className="w-full overflow-hidden rounded-xl bg-black/20 border border-white/10"></div>
            <p className="text-gray-400 mt-6 font-medium animate-pulse uppercase tracking-widest text-xs">Waiting for Scan...</p>
        </div>
    );

    const renderOrderDetails = () => {
        if (!scannedOrder) return null;
        
        const undeliveredItems = scannedOrder.items.filter(i => !i.isDelivered);
        const deliveredItems = scannedOrder.items.filter(i => i.isDelivered);

        return (
            <div className="text-left animate-fade-in-up w-full">
                {/* 2. Customer Summary Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-4">
                    <div className="col-span-2 border-b border-white/5 pb-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Customer</p>
                        <p className="text-lg font-bold text-white">{scannedOrder.studentName}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Screen / Seat</p>
                        <p className="text-lg font-bold text-amber-400 font-mono">{scannedOrder.seatNumber || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Paid Amount</p>
                        <p className="text-lg font-bold text-green-400 font-mono">₹{scannedOrder.totalAmount}</p>
                    </div>
                </div>

                {/* 3. Item Fulfillment List */}
                <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    {undeliveredItems.length > 0 && (
                        <div>
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Pending Items ({undeliveredItems.length})</h4>
                            <div className="space-y-2">
                                {undeliveredItems.map(item => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => handleToggleItem(item.id)}
                                        className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${
                                            selectedItemIds.has(item.id) 
                                            ? 'bg-indigo-600/30 border-indigo-400 shadow-xl' 
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                            selectedItemIds.has(item.id) ? 'bg-indigo-500 border-indigo-500 scale-110' : 'border-white/30'
                                        }`}>
                                            {selectedItemIds.has(item.id) && (
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-white font-bold text-sm">{item.name}</p>
                                            <p className="text-indigo-300 text-[10px] font-medium uppercase tracking-tighter">Quantity: {item.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {deliveredItems.length > 0 && (
                        <div className="opacity-40">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Served</h4>
                            <div className="space-y-1">
                                {deliveredItems.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                                        <p className="text-gray-400 font-medium text-xs line-through">{item.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Actions */}
                <div className="mt-8 flex flex-col gap-3">
                    <button 
                        onClick={handleSubmitDelivery}
                        disabled={isSubmitting || (undeliveredItems.length > 0 && selectedItemIds.size === 0)}
                        className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none transition-all active:scale-95"
                    >
                        {isSubmitting ? 'Updating...' : undeliveredItems.length === 0 ? 'Order Ready' : `Confirm Serving ${selectedItemIds.size} Items`}
                    </button>
                    <button onClick={handleReset} className="w-full py-2 text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors">
                        Scan Different Ticket
                    </button>
                </div>
            </div>
        );
    };

    const renderSuccessState = () => (
        <div className="text-center py-8 animate-pop-in">
             <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Collection Successful</h2>
            <p className="text-gray-400 mb-8 px-6 text-sm">Customer <b>{scannedOrder?.studentName}</b> is cleared for entry and order is closed.</p>
            <button onClick={handleReset} className="w-full bg-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all border border-white/10">
                Scan Next Ticket
            </button>
        </div>
    );

    const renderErrorState = () => (
        <div className="text-center py-8 animate-pop-in">
            <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h2 className="text-xl font-black text-white mb-2 uppercase">Access Denied</h2>
            <div className="text-red-400 bg-red-500/10 p-4 rounded-2xl border border-red-500/20 mb-8 text-sm font-medium">
                {errorMessage}
            </div>
            <button onClick={handleReset} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-indigo-500 transition-all">
                Try Another QR
            </button>
        </div>
    );

    return (
        <div className="max-w-md mx-auto w-full px-2">
            <div className="bg-gray-900/80 backdrop-blur-3xl border border-white/5 p-6 sm:p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <h1 className="text-2xl font-black mb-8 text-center text-white tracking-tight uppercase">
                    STAFF <span className="text-indigo-400">TERMINAL</span>
                </h1>
                
                <div className="flex flex-col items-center min-h-[300px] justify-center">
                    {scanResult === 'idle' && renderScanner()}
                    {scanResult === 'verifying' && (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                            <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Verifying Ticket...</p>
                        </div>
                    )}
                    {scanResult === 'showing-order' && renderOrderDetails()}
                    {scanResult === 'success' && renderSuccessState()}
                    {scanResult === 'error' && renderErrorState()}
                </div>
            </div>
        </div>
    );
};

export default ScanQrPage;
