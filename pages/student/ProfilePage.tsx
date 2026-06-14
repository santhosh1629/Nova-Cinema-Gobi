import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentProfile } from '../../services/mockApi';
import type { StudentProfile } from '../../types';
import { Link } from 'react-router-dom';

const StatCard: React.FC<{ icon: string; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-black/40 backdrop-blur-lg border border-white/20 p-4 rounded-xl flex items-center gap-4 text-white">
        <div className="bg-primary text-white p-3 rounded-full text-2xl">
            {icon}
        </div>
        <div>
            <p className="text-sm text-white/80">{label}</p>
            <p className="text-2xl font-bold font-heading">{value}</p>
        </div>
    </div>
);

const ProfilePage: React.FC = () => {
    const { user, loading: authLoading, promptForPhone, updateUser } = useAuth();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            promptForPhone();
        }
    }, [user, authLoading, promptForPhone]);

    const fetchProfile = useCallback(async () => {
        if (user) {
            try {
                setLoading(true);
                const profileData = await getStudentProfile(user.id);
                setProfile(profileData);
                setFormData({ name: profileData.name, phone: profileData.phone });
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);
    
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        try {
            setMessage('Updating profile...');
            await updateUser({ username: formData.name, phone: formData.phone });
            
            // Re-fetch everything from the server to ensure UI is in sync
            await fetchProfile();
            
            setIsEditing(false);
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
             setMessage('Failed to update profile.');
             console.error(error);
        }
    }

    if (loading || !user) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-pulse">
                <div className="h-9 bg-black/50 rounded-lg w-1/2 mx-auto"></div>
                <div>
                    <div className="h-7 bg-black/50 rounded-lg w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="h-20 bg-black/50 rounded-xl"></div>
                        <div className="h-20 bg-black/50 rounded-xl"></div>
                        <div className="h-20 bg-black/50 rounded-xl"></div>
                    </div>
                </div>
                <div className="h-48 bg-black/50 rounded-xl"></div>
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center text-white">Could not load profile.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 text-white">
            <h1 className="text-3xl font-bold font-heading text-center" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>Your Profile 👤</h1>
            
            {/* Quick Stats Section */}
            <div>
                <h2 className="text-xl font-bold font-heading mb-4" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>Quick Stats</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard icon="🧾" label="Total Orders" value={profile.totalOrders} />
                    <StatCard icon="💸" label="Lifetime Spend" value={`₹${profile.lifetimeSpend.toFixed(0)}`} />
                    <StatCard icon="❤️" label="Favorites" value={profile.favoriteItemsCount} />
                </div>
            </div>

            {/* Personal Info Section */}
            <div className="bg-black/50 backdrop-blur-lg border border-white/20 p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold font-heading">Personal Information</h2>
                    <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-semibold text-primary hover:underline">
                        {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                </div>
                {isEditing ? (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1">Name</label>
                            <input type="text" id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-white/30 bg-black/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                         <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-1">Phone</label>
                            <input type="tel" id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border border-white/30 bg-black/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                        <button type="submit" className="bg-primary text-white font-bold font-heading py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">Save Changes</button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-white/80">Name</p>
                            <p className="text-lg">{profile.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white/80">Phone</p>
                            <p className="text-lg">{profile.phone}</p>
                        </div>
                    </div>
                )}
                {message && <p className={`mt-4 text-center text-sm ${message.includes('success') ? 'text-green-400' : 'text-amber-400'}`}>{message}</p>}
            </div>
        </div>
    );
};

export default ProfilePage;