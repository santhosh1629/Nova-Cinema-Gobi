import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

declare const gsap: any;

type Step = 'enter_phone' | 'enter_otp_and_password' | 'success';

const ForgotPasswordPage: React.FC = () => {
    const [step, setStep] = useState<Step>('enter_phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    const { requestPasswordReset, verifyOtpAndResetPassword } = useAuth();
    const cardRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (typeof gsap !== 'undefined') {
            gsap.from(cardRef.current, { duration: 0.8, opacity: 0, y: 20, ease: 'power3.out' });
        }
    }, []);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!/^\d{10}$/.test(phone)) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }
        setLoading(true);
        try {
            const response = await requestPasswordReset(phone);
            setSuccessMessage(response.message);
            setStep('enter_otp_and_password');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }
        
        setLoading(true);
        try {
            const response = await verifyOtpAndResetPassword(phone, otp, newPassword);
            setSuccessMessage(response.message);
            setStep('success');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        const inputStyle = "w-full px-4 py-3 bg-white/5 border-b-2 border-white/20 text-white rounded-lg focus:outline-none focus:border-primary transition-all placeholder:text-white/40 focus:shadow-[0_0_15px_rgba(124,77,255,0.6)]";
        const buttonStyle = "w-full bg-primary text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform active:scale-[0.98] disabled:bg-primary/50 disabled:shadow-none hover:-translate-y-1 shadow-[0_5px_0_#6D28D9]";

        switch (step) {
            case 'enter_phone':
                return (
                    <form onSubmit={handleRequestOtp} className="space-y-6">
                        <div>
                            <label className="block text-white/80 font-semibold mb-2" htmlFor="phone">
                                Registered Phone Number
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={inputStyle}
                                placeholder="Enter your 10-digit phone number"
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className={buttonStyle}>
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                );
            case 'enter_otp_and_password':
                return (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                         {successMessage && <p className="text-green-300 bg-green-500/20 p-3 rounded-md text-sm text-center">{successMessage}</p>}
                         <p className="text-sm text-white/70">Enter the OTP sent to <span className="font-bold">{phone}</span> and set your new password. You may need to check your email spam for the link if phone delivery fails.</p>
                        <div>
                            <label className="block text-white/80 font-semibold mb-2" htmlFor="otp">
                                6-Digit OTP
                            </label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                maxLength={6}
                                onChange={(e) => setOtp(e.target.value)}
                                className={`${inputStyle} text-center tracking-[0.5em]`}
                                placeholder="______"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-white/80 font-semibold mb-2" htmlFor="newPassword">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={inputStyle}
                                placeholder="Minimum 6 characters"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-white/80 font-semibold mb-2" htmlFor="confirmPassword">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputStyle}
                                placeholder="Re-enter your new password"
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className={buttonStyle}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                );
            case 'success':
                return (
                    <div className="text-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-400 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
                        <p className="text-white/80 mb-6">{successMessage}</p>
                        <button onClick={() => navigate('/login-customer')} className={buttonStyle}>
                            Back to Login
                        </button>
                    </div>
                );
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-accent p-4 overflow-hidden">
            <div ref={cardRef} className="relative max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 z-10">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-white">Reset Your Password</h1>
                </div>
                {error && <p className="text-red-400 bg-red-500/20 p-3 rounded-md text-sm text-center mb-4">{error}</p>}
                
                {renderStep()}
                
                {step !== 'success' && (
                    <div className="text-center mt-6">
                        <Link to="/login-customer" className="text-sm text-white/70 hover:underline">Remembered your password? Login</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;