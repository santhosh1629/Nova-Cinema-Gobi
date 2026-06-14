
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getOwnerBankDetails, requestSaveBankDetailsOtp, verifyOtpAndSaveBankDetails } from '../../services/mockApi';
import type { OwnerBankDetails } from '../../types';
import { useAuth } from '../../context/AuthContext';

const initialFormState: OwnerBankDetails = {
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    upiId: '',
    email: '',
    phone: '',
};

const BankDetailsPage: React.FC = () => {
    const { user } = useAuth();
    const [initialDetails, setInitialDetails] = useState<OwnerBankDetails>(initialFormState);
    const [formData, setFormData] = useState<OwnerBankDetails>(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');

    const fetchDetails = useCallback(async () => {
        if (!user) return;
        try {
            const details = await getOwnerBankDetails(user.id);
            setFormData(details);
            setInitialDetails(details);
        } catch (error) {
            console.error("Failed to fetch bank details", error);
            setStatusMessage({ type: 'error', text: 'Could not load your details.' });
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const hasChanges = useMemo(() => JSON.stringify(initialDetails) !== JSON.stringify(formData), [initialDetails, formData]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!/^\d+$/.test(formData.accountNumber)) newErrors.accountNumber = 'Account number must contain only digits.';
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) newErrors.ifscCode = 'Please enter a valid 11-character IFSC code.';
        if (formData.upiId && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(formData.upiId)) newErrors.upiId = 'Please enter a valid UPI ID (e.g., your-name@bank).';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address.';
        if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Please enter a valid 10-digit phone number.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveClick = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });
        if (!validateForm()) return;
        setIsSubmitting(true);
        setStatusMessage({ type: 'info', text: 'Sending OTP...' });
        try {
            await requestSaveBankDetailsOtp(formData);
            setStatusMessage({ type: '', text: '' });
            setShowOtpModal(true);
        } catch (error) {
            setStatusMessage({ type: 'error', text: 'Failed to send OTP. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOtpVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);
        setStatusMessage({ type: 'info', text: 'Verifying OTP & Saving...' });
        try {
            const updatedDetails = await verifyOtpAndSaveBankDetails(formData, otp, user.id);
            setInitialDetails(updatedDetails);
            setShowOtpModal(false);
            setOtp('');
            setStatusMessage({ type: 'success', text: 'Payout details updated successfully!' });
        } catch (error) {
            setStatusMessage({ type: 'error', text: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if(errors[name]) setErrors(prev => ({...prev, [name]: ''}));
    };

    if (loading) {
        return <div className="max-w-2xl mx-auto p-8"><p>Loading details...</p></div>;
    }

    return (
        <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-md border border-gray-700">
            <h1 className="text-3xl font-bold mb-2 text-center text-white">Payout & Account Details 💳</h1>
            <p className="text-center text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-md mb-6">
                Please enter correct details. Incorrect information may delay payouts.
            </p>
            <form onSubmit={handleSaveClick} className="space-y-4">
                <div>
                    <label htmlFor="accountNumber" className="block text-gray-300 font-semibold mb-1">Account Number</label>
                    <input type="text" name="accountNumber" id="accountNumber" value={formData.accountNumber} onChange={handleInputChange} className={`input-field ${errors.accountNumber ? 'border-red-500' : ''}`} required />
                    {errors.accountNumber && <p className="text-red-400 text-xs mt-1">{errors.accountNumber}</p>}
                </div>
                <div>
                    <label htmlFor="bankName" className="block text-gray-300 font-semibold mb-1">Bank Name</label>
                    <input type="text" name="bankName" id="bankName" value={formData.bankName} onChange={handleInputChange} className="input-field" required />
                </div>
                <div>
                    <label htmlFor="ifscCode" className="block text-gray-300 font-semibold mb-1">IFSC Code</label>
                    <input type="text" name="ifscCode" id="ifscCode" value={formData.ifscCode} onChange={(e) => setFormData(p => ({...p, ifscCode: e.target.value.toUpperCase()}))} className={`input-field ${errors.ifscCode ? 'border-red-500' : ''}`} required />
                     {errors.ifscCode && <p className="text-red-400 text-xs mt-1">{errors.ifscCode}</p>}
                </div>
                <div>
                    <label htmlFor="upiId" className="block text-gray-300 font-semibold mb-1">UPI ID (Optional)</label>
                    <input type="text" name="upiId" id="upiId" value={formData.upiId || ''} onChange={handleInputChange} className={`input-field ${errors.upiId ? 'border-red-500' : ''}`} placeholder="e.g., your-name@bank" />
                    {errors.upiId && <p className="text-red-400 text-xs mt-1">{errors.upiId}</p>}
                </div>
                <div>
                    <label htmlFor="email" className="block text-gray-300 font-semibold mb-1">Verification Email</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className={`input-field ${errors.email ? 'border-red-500' : ''}`} required />
                     {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label htmlFor="phone" className="block text-gray-300 font-semibold mb-1">Verification Phone Number</label>
                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} className={`input-field ${errors.phone ? 'border-red-500' : ''}`} required />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>
                
                {statusMessage.text && !showOtpModal && (
                    <p className={`text-center text-sm ${statusMessage.type === 'error' ? 'text-red-400' : statusMessage.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                        {statusMessage.text}
                    </p>
                )}

                <button type="submit" disabled={!hasChanges || isSubmitting} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-500/50 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Processing...' : 'Save Changes'}
                </button>
            </form>

            {showOtpModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl w-full max-w-sm animate-fade-in-down">
                        <h2 className="text-xl font-bold mb-2 text-center text-white">Verify Your Identity</h2>
                        <p className="text-center text-gray-400 mb-6">
                            An OTP has been sent. Please enter the 6-digit code below. (Hint: use 123456)
                        </p>
                        <form onSubmit={handleOtpVerification}>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                className="w-full text-center text-2xl tracking-[0.5em] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-700 border-gray-600 text-white"
                                required
                            />
                            {statusMessage.text && statusMessage.type === 'error' && (
                                <p className="text-red-400 text-sm mt-2 text-center">{statusMessage.text}</p>
                            )}
                            <div className="flex justify-end gap-4 mt-6">
                                <button type="button" onClick={() => setShowOtpModal(false)} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-500/50">
                                    {isSubmitting ? 'Verifying...' : 'Verify & Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .input-field {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    border: 1px solid #4A5568; /* gray-600 */
                    background-color: #1F2937; /* gray-800 */
                    color: #F7FAFC; /* gray-100 */
                    transition: box-shadow 0.2s;
                }
                .input-field:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px #6366F1;
                    border-color: #6366F1;
                }
            `}</style>
        </div>
    );
};

export default BankDetailsPage;