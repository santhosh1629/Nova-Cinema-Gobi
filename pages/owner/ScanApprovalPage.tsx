import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    const [phoneOrEmail, setPhoneOrEmail] = useState('');
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
            const loggedInUser = await login(phoneOrEmail, password);
            if (loggedInUser.role === Role.CANTEEN_OWNER) {
                if (loggedInUser.approvalStatus === 'approved') {
                    navigate('/owner/scan-only');
                } else {
                    setError('Your account is waiting for admin approval.');
                }
            } else {
                setError('Access denied. This portal is for cinema partners only.');
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
                <label className="block text-gray-200 font-semibold mb-2" htmlFor="phoneOrEmail">Email or Phone Number</label>
                <input type="text" id="phoneOrEmail" value={phoneOrEmail} onChange={(e) => setPhoneOrEmail(e.target.value)} className="w-full input-field" placeholder="e.g., mail@example.com" required />
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

const RegisterForm: React.FC = () => {
    const [name, setName] = useState('');
    const [canteenName, setCanteenName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [idProofUrl, setIdProofUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [fileStatus, setFileStatus] = useState({ message: '', isError: false });
    const { registerOwner } = useAuth();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setIdProofUrl(null);
            setFileStatus({ message: '', isError: false });
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setFileStatus({ message: 'File too large (max 10MB).', isError: true }); return;
        }
        if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
            setFileStatus({ message: 'Invalid file (JPG, PNG, PDF only).', isError: true }); return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => { setIdProofUrl(reader.result as string); setFileStatus({ message: '✅ ID Proof processed.', isError: false }); };
        reader.onerror = () => setFileStatus({ message: 'Error reading file.', isError: true });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6 || !/^\d{10}$/.test(phone) || !idProofUrl) {
            setError("Please fill all fields correctly and upload an ID proof.");
            return;
        }
        setLoading(true);
        try {
            await registerOwner(name, email, phone, password, canteenName, idProofUrl);
            setIsSubmitted(true);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };
    
    if (isSubmitted) {
        return (
            <div className="text-center text-white p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3 className="text-xl font-bold">Registration Submitted</h3>
                <p className="text-gray-300 mt-2">Your account is now pending approval from the administrator.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required className="input-field" />
            <input type="text" value={canteenName} onChange={(e) => setCanteenName(e.target.value)} placeholder="Canteen Name" required className="input-field" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="input-field" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-Digit Phone Number" required className="input-field" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 characters)" required className="input-field" />
            <div>
                <label htmlFor="id-proof" className="block text-sm font-medium text-gray-300 mb-2">ID Proof (Aadhar/College ID, etc.)</label>
                <input id="id-proof" type="file" onChange={handleFileChange} required className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700" />
                {fileStatus.message && <p className={`text-xs mt-2 ${fileStatus.isError ? 'text-red-400' : 'text-green-400'}`}>{fileStatus.message}</p>}
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Submitting...' : 'Create Account'}
            </button>
        </form>
    );
};


const ScanApprovalPage: React.FC = () => {
    const [view, setView] = useState<'login' | 'register'>('login');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="max-w-md w-full mx-auto bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md border border-gray-700">
                <style>{`
                    .input-field { width: 100%; padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid #374151; background-color: #1F2937; color: white; }
                    .btn-primary { background-color: #4F46E5; color: white; font-weight: bold; padding: 0.75rem 1rem; border-radius: 0.5rem; transition: background-color 0.2s; }
                    .btn-primary:hover { background-color: #4338CA; }
                    .btn-primary:disabled { background-color: #4F46E580; cursor: not-allowed; }
                `}</style>
                <h1 className="text-2xl font-bold text-center text-white mb-4">Staff Terminal</h1>
                <div className="flex justify-center border-b border-gray-600 mb-6">
                    <button onClick={() => setView('login')} className={`px-4 py-2 font-semibold text-sm transition-colors ${view === 'login' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                        Login
                    </button>
                    <button onClick={() => setView('register')} className={`px-4 py-2 font-semibold text-sm transition-colors ${view === 'register' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                        Create Account
                    </button>
                </div>
                {view === 'login' ? <LoginForm /> : <RegisterForm />}
            </div>
        </div>
    );
};

export default ScanApprovalPage;