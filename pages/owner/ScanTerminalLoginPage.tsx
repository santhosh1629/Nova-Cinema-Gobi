import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

const EyeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
);

const LoginForm: React.FC = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const loggedInUser = await login(phone, password);
            // Staff are CANTEEN_OWNERs without a canteenName
            if (loggedInUser.role === Role.CANTEEN_OWNER && !loggedInUser.canteenName) {
                navigate('/scan-terminal/home');
            } else {
                setError('Access denied. This terminal is for Scan Staff only.');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div>
                <label className="block text-gray-200 font-semibold mb-2" htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full input-field" placeholder="e.g., 9876543210" required />
            </div>
            <div>
                <label className="block text-gray-200 font-semibold mb-2" htmlFor="password">Password</label>
                <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full input-field pr-10" placeholder="Enter your password" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                </div>
            </div>
            {error && <p className="text-red-400 text-sm text-center !-mt-2">{error}</p>}
            <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Logging in...' : 'Login to Scan'}
            </button>
        </form>
    );
};

const ScanTerminalLoginPage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="max-w-md w-full mx-auto bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md border border-gray-700">
                <style>{`
                    .input-field { width: 100%; padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid #374151; background-color: #1F2937; color: white; }
                    .btn-primary { background-color: #4F46E5; color: white; font-weight: bold; padding: 0.75rem 1rem; border-radius: 0.5rem; transition: background-color 0.2s; }
                    .btn-primary:hover { background-color: #4338CA; }
                    .btn-primary:disabled { background-color: #4F46E580; cursor: not-allowed; }
                `}</style>
                <h1 className="text-2xl font-bold text-center text-white mb-6">Scan Terminal Login</h1>
                <LoginForm />
            </div>
        </div>
    );
};

export default ScanTerminalLoginPage;