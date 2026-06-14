import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

// --- Icon Components ---
const MenuIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);
const DashboardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>);
const MenuBoardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>);
const ScanIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v-3m0 0h-3m3 3h3m-9 0h-2v-2m0 16h3m9 0h2v-5m-14 0h2v5" /></svg>);
const PopularityIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>);
const RewardsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const FeedbackIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>);
const OffersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 11h.01M7 15h.01M13 7h.01M13 11h.01M13 15h.01M17 7h.01M17 11h.01M17 15h.01M4 5h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" /></svg>);
const SalesIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>);
const LogoutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);

const OwnerLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [activeToast, setActiveToast] = useState<{ id: number, message: string } | null>(null);

    useEffect(() => {
        const handleShowToast = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setActiveToast({ id: Date.now(), message: detail.message });
            setTimeout(() => setActiveToast(null), 3000);
        };
        window.addEventListener('show-owner-toast', handleShowToast);
        return () => window.removeEventListener('show-owner-toast', handleShowToast);
    }, []);

    const navLinks = [
        { to: "/owner/dashboard", icon: <DashboardIcon />, label: "Dashboard" },
        { to: "/owner/sales", icon: <SalesIcon />, label: "Sales Report" },
        { to: "/owner/scan", icon: <ScanIcon />, label: "Scan QR" },
        { to: "/owner/games-menu", icon: <DashboardIcon />, label: "Screens" },
        { to: "/owner/popularity", icon: <PopularityIcon />, label: "Popularity" },
        { to: "/owner/feedback", icon: <FeedbackIcon />, label: "Feedback" },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (user && user.role !== Role.CANTEEN_OWNER) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40 h-16 flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsDrawerOpen(true)} className="p-2 hover:bg-gray-700 rounded-lg lg:hidden transition-colors">
                        <MenuIcon />
                    </button>
                    <h1 className="text-xl font-bold text-indigo-400 font-heading tracking-tight uppercase">NOVA CINEMA GOBI <span className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-2">Owner</span></h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="hidden sm:inline text-sm text-gray-400">Welcome, <span className="text-white font-semibold">{user?.username}</span></span>
                    <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-all" title="Logout">
                        <LogoutIcon />
                    </button>
                </div>
            </header>

            <div className="flex flex-1">
                {/* Sidebar Drawer for mobile */}
                <div className={`fixed inset-0 bg-black/60 z-50 transition-opacity lg:hidden ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsDrawerOpen(false)} />
                
                <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-800 border-r border-gray-700 z-50 transform transition-transform lg:translate-x-0 lg:static lg:block ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex items-center justify-between p-4 border-b border-gray-700 lg:hidden">
                        <span className="font-bold text-indigo-400">Navigation</span>
                        <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-white">
                            <CloseIcon />
                        </button>
                    </div>
                    <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)] scrollbar-thin">
                        {navLinks.map(link => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                onClick={() => setIsDrawerOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                                    isActive 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                        : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                    }`
                                }
                            >
                                {link.icon}
                                <span>{link.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
                    <Outlet />
                </main>
            </div>

            {/* Owner Toasts */}
            {activeToast && (
                <div key={activeToast.id} className="fixed bottom-8 right-8 z-[60] animate-fade-in-up">
                    <div className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-2xl border border-indigo-400 flex items-center gap-3">
                        <span className="text-xl">🔔</span>
                        <p className="font-bold">{activeToast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerLayout;