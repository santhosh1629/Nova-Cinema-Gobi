import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
// Fix: Import 'getAllRewardsForOwner' as 'getRewards' is not exported. Import 'redeemReward'.
import { getAllRewardsForOwner, getStudentProfile, redeemReward } from '../../services/mockApi';
import type { Reward, StudentProfile } from '../../types';
import { Link } from 'react-router-dom';

const RewardCard: React.FC<{ reward: Reward; userPoints: number; onRedeem: (rewardId: string) => void; isRedeeming: boolean; }> = ({ reward, userPoints, onRedeem, isRedeeming }) => {
    const canAfford = userPoints >= reward.pointsCost;
    const isExpired = reward.expiryDate ? new Date(reward.expiryDate) < new Date() : false;
    const isDisabled = !canAfford || isRedeeming || isExpired;

    const getButtonText = () => {
        if (isRedeeming) return 'Redeeming...';
        if (isExpired) return 'Expired';
        if (!canAfford) return 'Not Enough Points';
        return 'Redeem Now';
    }

    return (
        <div className={`bg-black/50 backdrop-blur-lg border border-white/20 rounded-lg shadow-md p-6 flex flex-col justify-between transition-all text-white ${isDisabled && !isRedeeming ? 'opacity-60 grayscale' : ''}`}>
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold">{reward.title}</h3>
                    <div className="text-right">
                        <p className="text-2xl font-black text-amber-400">{reward.pointsCost}</p>
                        <p className="text-sm text-amber-400/80">Points</p>
                    </div>
                </div>
                <p className="text-white/80 mt-2 mb-4">{reward.description}</p>
                {reward.expiryDate && (
                    <p className={`text-sm font-semibold ${isExpired ? 'text-red-400' : 'text-white/70'}`}>
                        Expires on: {new Date(reward.expiryDate).toLocaleDateString()}
                    </p>
                )}
            </div>
            <button
                onClick={() => onRedeem(reward.id)}
                disabled={isDisabled}
                className="w-full mt-auto bg-amber-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors disabled:bg-amber-500/50 disabled:cursor-not-allowed"
            >
                {getButtonText()}
            </button>
        </div>
    );
};

const RewardCardSkeleton: React.FC = () => (
    <div className="bg-black/50 backdrop-blur-lg rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex justify-between items-start">
            <div className="w-2/3">
                <div className="h-6 bg-gray-600/30 rounded w-full mb-2"></div>
                <div className="h-6 bg-gray-600/30 rounded w-1/2"></div>
            </div>
            <div className="w-1/4">
                <div className="h-8 bg-gray-600/30 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-600/30 rounded w-full"></div>
            </div>
        </div>
        <div className="h-4 bg-gray-600/30 rounded w-full mt-4"></div>
        <div className="h-4 bg-gray-600/30 rounded w-3/4 mt-2 mb-4"></div>
        <div className="h-10 bg-gray-600/30 rounded-lg w-full mt-auto"></div>
    </div>
);


const RewardsPage: React.FC = () => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const { user } = useAuth();

    const fetchData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const [rewardsData, profileData] = await Promise.all([
                getAllRewardsForOwner(),
                getStudentProfile(user.id)
            ]);
            setRewards(rewardsData);
            setProfile(profileData);
        } catch (error) {
            console.error("Failed to fetch rewards data", error);
            setNotification({ type: 'error', message: 'Could not load rewards.' });
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleRedeem = async (rewardId: string) => {
        if (!user) return;
        setIsRedeeming(true);
        setNotification(null);
        try {
            const redeemedCoupon = await redeemReward(user.id, rewardId);
            setNotification({ type: 'success', message: `Successfully redeemed! Your coupon code is ${redeemedCoupon.code}.` });
            // Refresh profile to show updated points
            const updatedProfile = await getStudentProfile(user.id);
            setProfile(updatedProfile);
            setTimeout(() => setNotification(null), 5000);
        } catch(err) {
            setNotification({ type: 'error', message: (err as Error).message });
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setIsRedeeming(false);
        }
    };

    if (loading) {
        return (
            <div>
                <div className="text-center mb-8 animate-pulse">
                    <div className="h-9 bg-black/50 rounded-lg w-1/2 mx-auto"></div>
                    <div className="h-5 bg-black/50 rounded-lg w-3/4 mx-auto mt-2"></div>
                </div>
                <div className="bg-black/50 backdrop-blur-lg p-6 rounded-2xl mb-8 animate-pulse">
                    <div className="h-16"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <RewardCardSkeleton />
                    <RewardCardSkeleton />
                    <RewardCardSkeleton />
                </div>
            </div>
        );
    }
    
    return (
        <div className="text-white">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>Loyalty Rewards ⭐</h1>
                <p className="text-white/90 mt-2" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>Redeem your hard-earned points for exclusive discounts!</p>
            </div>
            
            <div className="bg-black/50 backdrop-blur-lg border-2 border-dashed border-amber-400 p-6 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
                <div>
                    <p className="text-lg font-semibold text-amber-300">Your Current Balance</p>
                    <p className="text-5xl font-black text-amber-400">{profile?.loyaltyPoints ?? 0} <span className="text-3xl font-bold">Points</span></p>
                </div>
                <Link to="/customer/coupons" className="mt-4 sm:mt-0 bg-amber-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors">
                    View My Coupons
                </Link>
            </div>
            
            {notification && (
                <div className={`p-4 mb-6 rounded-lg text-center animate-fade-in-down ${notification.type === 'success' ? 'bg-green-500/80' : 'bg-red-500/80'} backdrop-blur-sm`}>
                    {notification.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map(reward => (
                    <RewardCard 
                        key={reward.id} 
                        reward={reward} 
                        userPoints={profile?.loyaltyPoints ?? 0}
                        onRedeem={handleRedeem}
                        isRedeeming={isRedeeming}
                    />
                ))}
            </div>
        </div>
    );
};

export default RewardsPage;