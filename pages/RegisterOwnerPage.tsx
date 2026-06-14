import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import { supabase } from '../services/supabase'; // No longer needed for storage upload

const RegisterOwnerPage: React.FC = () => {
    const [name, setName] = useState('');
    const [canteenName, setCanteenName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [idProofUrl, setIdProofUrl] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [fileStatus, setFileStatus] = useState({ message: '', isError: false });
    const { registerOwner } = useAuth();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (!file) {
            setIdProofUrl(null);
            setFileStatus({ message: '', isError: false });
            return;
        }

        const fileSizeMB = file.size / 1024 / 1024;
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

        if (fileSizeMB > 2) {
            setIdProofUrl(null);
            setFileStatus({ message: 'File is too large. Maximum size is 2 MB.', isError: true });
            e.target.value = ''; // Clear the input
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            setIdProofUrl(null);
            setFileStatus({ message: 'Invalid file format. Please use .jpg, .png, or .pdf.', isError: true });
            e.target.value = ''; // Clear the input
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setIdProofUrl(reader.result as string);
            setFileStatus({ message: '✅ ID Proof processed successfully.', isError: false });
        };
        reader.onerror = (error) => {
            console.error("File reading error:", error);
            setIdProofUrl(null);
            setFileStatus({ message: 'Error reading file.', isError: true });
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (!/^\d{10}$/.test(phone)) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }
        if (!idProofUrl) {
            setError("⚠️ Please upload a valid ID proof to continue.");
            if (!fileStatus.message) {
                 setFileStatus({ message: "⚠️ Please upload a valid ID proof to continue.", isError: true });
            }
            return;
        }
        if (!agreedToTerms) {
            setError("You must agree to the Terms & Conditions and confirm your details.");
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 overflow-hidden">
            <div className="relative max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 animate-pop-in">
                {isSubmitted ? (
                    <div className="text-center text-white animate-fade-in-down">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h2 className="text-3xl font-bold">Registration Submitted</h2>
                        <p className="text-gray-300 mt-2 mb-6">
                            Thank you! Your registration is now pending approval from the administrator. You will be notified once your account is active.
                        </p>
                        <Link to="/login-owner" className="w-full inline-block text-center bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:-translate-y-1 transition-transform">
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-bold text-white">Partner Registration</h2>
                            <p className="text-gray-300 mt-2">Join our network of Nova Cinemas.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required className="input-field" />
                            <input type="text" value={canteenName} onChange={(e) => setCanteenName(e.target.value)} placeholder="Canteen Name" required className="input-field" />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="input-field" />
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-Digit Phone Number" required className="input-field" />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 characters)" required className="input-field" />
                            <div>
                               <label htmlFor="id-proof" className="block text-sm font-medium text-gray-300 mb-2">Upload ID Proof (Aadhar / College ID / License)</label>
                                <input 
                                    id="id-proof" 
                                    type="file" 
                                    onChange={handleFileChange} 
                                    accept="image/jpeg,image/png,application/pdf" 
                                    required 
                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700" 
                                />
                                {fileStatus.message && (
                                    <p className={`text-xs mt-2 ${fileStatus.isError ? 'text-red-400' : 'text-green-400'}`}>
                                        {fileStatus.message}
                                    </p>
                                )}
                            </div>
                             <div className="flex items-start space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="h-4 w-4 mt-1 rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500"
                                />
                                <label htmlFor="terms" className="text-xs text-gray-300">
                                    I have read and agree to the{' '}
                                    <Link to="/terms?for=owner" className="font-bold text-indigo-400 hover:underline">
                                        Nova Cinema Gobi Terms & Conditions (Owner).
                                    </Link>
                                    {' '}I confirm all business/bank details are true.
                                </label>
                            </div>

                            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                            
                            <button type="submit" disabled={loading || !agreedToTerms || !idProofUrl} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow-[0_5px_15px_rgba(99,102,241,0.3)] transition-all transform hover:-translate-y-1 active:scale-95 disabled:bg-indigo-400/50 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed">
                                {loading ? 'Submitting...' : 'Register'}
                            </button>
                        </form>

                        <div className="text-center mt-6">
                            <Link to="/login-owner" className="text-sm text-gray-400 hover:text-white font-medium transition-colors">Already have an account? Login</Link>
                        </div>
                    </>
                )}
            </div>
             <style>{`
                .input-field {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    border: 1px solid #374151; /* gray-700 */
                    background-color: #1F2937; /* gray-800 */
                    color: white;
                    transition: all 0.2s;
                    placeholder-color: #6B7280; /* gray-500 */
                }
                .input-field:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px #6366F1; /* indigo-500 */
                    border-color: #6366F1;
                }
            `}</style>
        </div>
    );
};

export default RegisterOwnerPage;