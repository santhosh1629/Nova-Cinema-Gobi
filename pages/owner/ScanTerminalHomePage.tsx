import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import ScanQrPage from './ScanQrPage'; 

const ScanTerminalHomePage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Redirect full owners away from this restricted page.
    if (user && user.canteenName) {
        return <Navigate to="/owner/dashboard" replace />;
    }

    const handleLogout = async () => {
        await logout();
        navigate('/owner/scan-terminal');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col p-4">
            <header className="flex justify-between items-center max-w-md mx-auto w-full">
                <div>
                    <h1 className="text-xl font-bold">Scan Terminal</h1>
                    <p className="text-sm text-gray-400">Welcome, {user?.username}</p>
                </div>
                <button 
                    onClick={handleLogout} 
                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Logout
                </button>
            </header>
            <main className="flex-grow flex items-center justify-center">
                <ScanQrPage />
            </main>
        </div>
    );
};

export default ScanTerminalHomePage;