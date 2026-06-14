
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import DynamicBackground from '../../components/student/DynamicBackground';
import { useAuth } from '../../context/AuthContext';
import { getStudentOrders } from '../../services/mockApi';
import { Order, OrderStatus } from '../../types';

type ToastType = 'cart-add' | 'cart-warn' | 'stock-out' | 'payment-success' | 'payment-error' | 'logout-success';
interface ToastInfo {
  id: number;
  message: string;
  type: ToastType;
}

const ConnectionBadge: React.FC = () => (
    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
        <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
        </span>
        <span className="text-[8px] font-bold text-green-400 uppercase tracking-tighter">Live</span>
    </div>
);

const getCartCountFromStorage = () => {
    try {
        const cart = localStorage.getItem('cart');
        const parsedCart: { quantity: number }[] = cart ? JSON.parse(cart) : [];
        return parsedCart.reduce((total, item) => total + item.quantity, 0);
    } catch {
        return 0;
    }
};

const formatToKolkataTime = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return '10:00 AM – 01:00 PM';
    return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const ActiveOrderTracker: React.FC<{ order: Order }> = ({ order }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const hasScreen = order.items.some(i => i.category === 'game');

    useEffect(() => {
        // If it's a screen order that is ACTIVE (Collected), calculate countdown
        if (hasScreen && order.status === OrderStatus.COLLECTED && order.gameEndTime) {
            const endTime = new Date(order.gameEndTime).getTime();
            const timer = setInterval(() => {
                const now = Date.now();
                const distance = endTime - now;

                if (distance > 0) {
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
                } else {
                    setTimeLeft('TIME OVER');
                    clearInterval(timer);
                }
            }, 1000);
            return () => clearInterval(timer);
        } else if (order.status === OrderStatus.PENDING) {
            // Standard food prep time logic or Waiting for Screen Start
            const PREPARATION_TIME_MS = 15 * 60 * 1000;
            const orderTimestamp = new Date(order.timestamp).getTime();
            const estimatedReadyTime = orderTimestamp + PREPARATION_TIME_MS;

            const timer = setInterval(() => {
                const now = Date.now();
                const distance = estimatedReadyTime - now;

                if (distance > 0) {
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
                } else {
                    setTimeLeft('00:00');
                    clearInterval(timer);
                }
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setTimeLeft('');
        }
    }, [order, hasScreen]);
    
    const isPrepared = order.status === OrderStatus.PREPARED;
    const isPending = order.status === OrderStatus.PENDING;
    const isActiveScreen = order.status === OrderStatus.COLLECTED && hasScreen;

    if (isActiveScreen) {
        return (
            <div className="bg-indigo-600 text-white backdrop-blur-sm animate-fade-in-down shadow-lg border-b border-indigo-400">
                <div className="container mx-auto px-4 py-2 text-center flex justify-between items-center">
                    <span className="font-bold text-sm">🎬 Screen Active</span>
                    <span className="font-mono text-lg font-black bg-black/20 px-3 py-0.5 rounded">{timeLeft}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`
            ${isPrepared ? 'bg-green-500/80 text-white' : 'bg-primary/80 text-background'}
            backdrop-blur-sm animate-fade-in-down shadow-lg
        `}>
            <div className="container mx-auto px-4 py-2 text-center">
                {isPrepared && (
                    <p className="font-black text-sm">
                        🔥 Your order #{order.id.slice(-6)} is ready for pickup!
                    </p>
                )}
                {isPending && (
                    <p className="font-semibold text-sm">
                        {hasScreen ? `⏳ Slot Reserved. Scan QR to Start.` : `🧑‍🍳 Preparing order #${order.id.slice(-6)}. Est: ${timeLeft}`}
                    </p>
                )}
            </div>
        </div>
    );
};

// --- Icon Components ---
const MenuIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);
// Primary Nav Icons
const MenuBoardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>);
const ScreenIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>);
const CartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);
const HistoryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>);
// Drawer Icons
const ProfileIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5 mr-3" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const FeedbackDrawerIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>);
const LogoutIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);

// --- Toast Icons ---
const ToastCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const AnimatedCheckIcon = () => (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
        strokeDasharray="24" strokeDashoffset="24" className="animate-draw-check" />
    </svg>
);

const greetings = [
    "HUNGRY?",
    "ORDER. EAT. REPEAT.",
    "WHAT'S THE CRAVING?",
    "FEED THE BEAST.",
];

const CustomerLayout: React.FC = () => {
  const { user, logout, promptForPhone } = useAuth();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastInfo | null>(null);
  const location = useLocation();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [centerToast, setCenterToast] = useState<ToastInfo | null>(null);
  const [cartCount, setCartCount] = useState(0);

  const greeting = useMemo(() => greetings[Math.floor(Math.random() * greetings.length)], []);

  const updateCartCount = useCallback(() => {
    const count = getCartCountFromStorage();
    setCartCount(count);
  }, []);

  useEffect(() => {
    updateCartCount(); // Initial count

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'cart') {
            updateCartCount();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('itemAddedToCart', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('itemAddedToCart', updateCartCount);
        window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, [updateCartCount]);

  useEffect(() => {
    const handleItemAdded = () => {
        setIsCartAnimating(true);
        setTimeout(() => setIsCartAnimating(false), 300); // Snappier feedback
    };
    window.addEventListener('itemAddedToCart', handleItemAdded);
    return () => window.removeEventListener('itemAddedToCart', handleItemAdded);
  }, []);

   useEffect(() => {
    const handleShowToast = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        setActiveToast({ id: Date.now(), ...detail }); 
    };
    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, []);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    setCenterToast({ id: Date.now(), message: 'Logged out successfully!', type: 'logout-success' });
    setTimeout(() => {
        logout();
        navigate('/');
    }, 1500); // Snappier logout
  };

  const primaryNavLinks = [
    { to: "/customer/games", icon: <ScreenIcon />, label: "Screens" },
    { to: "/customer/cart", icon: <CartIcon />, label: "Cart" },
    { to: "/customer/history", icon: <HistoryIcon />, label: "History" },
  ];
  
  const drawerNavLinks = [
    { to: "/customer/profile", icon: <ProfileIcon />, label: "Profile", protected: true },
    { to: "/customer/feedback", icon: <FeedbackDrawerIcon />, label: "Feedback", protected: true },
  ];
  
  const handleProtectedLinkClick = (e: React.MouseEvent, to: string) => {
      if (!user) {
          e.preventDefault();
          promptForPhone(() => navigate(to));
      }
  };

  const DrawerNavLink: React.FC<{ to: string, icon: React.ReactNode, label: string, isProtected?: boolean }> = ({ to, icon, label, isProtected }) => (
    <NavLink
        to={to}
        onClick={(e) => {
            if (isProtected) handleProtectedLinkClick(e, to);
            setIsDrawerOpen(false);
        }}
        className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
            isActive ? 'bg-primary text-background font-black' : 'text-textSecondary hover:bg-surface hover:text-textPrimary'
            }`
        }
    >
        {icon} {label}
    </NavLink>
  );

  const fetchActiveOrder = useCallback(async () => {
    if (user) {
        try {
            const orders = await getStudentOrders(user.id);
            if (!orders || orders.length === 0) {
                setActiveOrder(null);
                return;
            }
            const currentActiveOrder = orders.find(o => 
                o.status === OrderStatus.PENDING || 
                o.status === OrderStatus.PREPARED ||
                (o.status === OrderStatus.COLLECTED && o.items.some(i => i.category === 'game') && o.gameEndTime && new Date(o.gameEndTime).getTime() > Date.now())
            ) || null;

            setActiveOrder(currentActiveOrder);
        } catch (error) { }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
        fetchActiveOrder();
        // Snappier background polling for layout-wide active order tracking
        const intervalId = setInterval(fetchActiveOrder, 5000); 
        return () => clearInterval(intervalId);
    } else {
        setActiveOrder(null);
    }
  }, [user, fetchActiveOrder]);

  const getToastStyles = (type: ToastType) => {
    switch(type) {
      case 'cart-add': return { bg: 'bg-toast-cart-add', icon: <div className="animate-cart-icon-slide"><ToastCartIcon/></div>, glow: 'shadow-[0_0_20px_rgba(190,24,93,0.5)]' };
      case 'cart-warn': return { bg: 'bg-toast-cart-warn', icon: '⚠️', glow: 'shadow-[0_0_20px_rgba(252,163,17,0.5)]' };
      case 'stock-out': return { bg: 'bg-toast-stock-out', icon: '❌', glow: 'shadow-[0_0_20px_rgba(185,28,28,0.5)]' };
      case 'payment-success': return { bg: 'bg-toast-payment-success backdrop-blur-md', icon: <AnimatedCheckIcon />, glow: 'shadow-[0_0_20px_rgba(34,197,94,0.6)]' };
      case 'payment-error': return { bg: 'bg-toast-payment-error', icon: '🚫', glow: 'shadow-[0_0_20px_rgba(185,28,28,0.5)]' };
      case 'logout-success': return { bg: 'bg-gradient-to-r from-violet-600 to-red-600', icon: '👋', glow: 'shadow-[0_0_20px_rgba(190,24,93,0.5)]' };
      default: return { bg: 'bg-gray-700', icon: '🔔', glow: '' };
    }
  };


  return (
    <div className="flex flex-col min-h-screen font-sans text-textPrimary">
      <DynamicBackground />
      <div className="absolute inset-0 bg-background/40 -z-40"></div>

       {/* Global Toast Notification */}
      {activeToast && (
        <div key={activeToast.id} className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm pointer-events-none">
          <div 
            onAnimationEnd={() => setActiveToast(null)}
            className={`
              flex items-center gap-4 p-3 pr-4 rounded-full shadow-lg text-white font-bold 
              border border-white/20 animate-toast ${getToastStyles(activeToast.type).bg} ${getToastStyles(activeToast.type).glow}
            `}
            style={{ animationDuration: '2.5s' }}
          >
            <span className="flex-shrink-0 h-8 w-8 rounded-full bg-black/20 flex items-center justify-center text-xl">
              {getToastStyles(activeToast.type).icon}
            </span>
            <p className="flex-grow text-sm">{activeToast.message}</p>
          </div>
        </div>
      )}

      {/* Connection status and Active order header */}
      <div className="sticky top-0 z-40">
        <header className="bg-background/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-4">
             <div className="flex items-center gap-3">
                <button onClick={() => setIsDrawerOpen(true)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <MenuIcon />
                </button>
                <div className="flex flex-col">
                    <span className="font-logo font-black text-primary text-sm tracking-widest leading-none">NOVA CINEMA</span>
                    <span className="font-logo font-bold text-white text-[8px] tracking-[0.3em] uppercase mt-0.5">GOBI</span>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <ConnectionBadge />
                <button onClick={() => navigate('/customer/profile')} className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-white">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                </button>
             </div>
        </header>
        {activeOrder && <ActiveOrderTracker order={activeOrder} />}
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-white/5 px-6 pb-safe">
        <div className="flex justify-between items-center h-16 max-w-lg mx-auto">
            {primaryNavLinks.map(link => (
                <NavLink 
                    key={link.to} 
                    to={link.to} 
                    className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <div className="relative">
                        {link.icon}
                        {link.label === 'Cart' && cartCount > 0 && (
                            <span className={`absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-background ${isCartAnimating ? 'animate-bounce' : ''}`}>
                                {cartCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{link.label}</span>
                </NavLink>
            ))}
        </div>
      </nav>

      {/* Side Drawer */}
      {isDrawerOpen && (
        <>
            <div className="fixed inset-0 bg-black/70 z-50 animate-fade-in" onClick={() => setIsDrawerOpen(false)} />
            <aside className="fixed top-0 left-0 h-full w-72 bg-gray-900 border-r border-white/10 z-[60] animate-slide-in-left flex flex-col p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black text-primary tracking-tighter uppercase">Menu</h2>
                    <button onClick={() => setIsDrawerOpen(false)} className="text-gray-500 hover:text-white transition-colors"><CloseIcon /></button>
                </div>
                <div className="space-y-2 flex-grow">
                    {drawerNavLinks.map(link => (
                        <DrawerNavLink key={link.to} {...link} isProtected={link.protected} />
                    ))}
                </div>
                <div className="pt-6 border-t border-white/10">
                    <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center w-full px-4 py-3 rounded-lg text-lg font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogoutIcon className="h-5 w-5 mr-3" /> Logout
                    </button>
                </div>
            </aside>
        </>
      )}

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gray-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl animate-pop-in">
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Ready to leave?</h2>
                <p className="text-gray-400 mb-8 text-sm">We'll miss you! Make sure you've collected your snacks.</p>
                <div className="flex gap-4">
                    <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors">Stay</button>
                    <button onClick={confirmLogout} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">Logout</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLayout;
