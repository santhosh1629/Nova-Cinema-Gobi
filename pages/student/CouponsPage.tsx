
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllStudentCoupons } from '../../services/mockApi';
import type { Offer } from '../../types';
import { useNavigate } from 'react-router-dom';

const CouponCard: React.FC<{ offer: Offer }> = ({ offer }) => {
    const navigate = useNavigate();
    const isReward = offer.isReward;
    const isUsed = offer.isUsed;
    const remainingUses = (offer.usageCount || 1) - (offer.redeemedCount || 0);
    const isMultiUse = (offer.usageCount || 1) > 1;


    const handleUseCoupon = () => {
        navigate('/customer/cart');
    };

    return (
        <div className={`relative ${isUsed ? 'bg-gray-700/50' : (isReward ? 'bg-black/60' : 'bg-black/50')} backdrop-blur-lg border border-white/20 rounded-lg shadow-lg p-6 overflow-hidden text-white transition-opacity ${isUsed ? 'opacity-50' : ''}`}>
             {isReward && !isUsed && (
                <>
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-violet-500/20 rounded-full"></div>
                    <div className="absolute -bottom-8 -left-2 w-24 h-24 bg-indigo-500/10 rounded-full"></div>
                </>
            )}
            
            <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <p className="font-mono text-xl font-bold tracking-widest bg-white/10 backdrop-blur-sm px-3 py-1 rounded-md inline-block border border-white/30">
                            {offer.code}
                        </p>
                        <span className={`text-lg font-extrabold font-heading ${isReward ? 'text-violet-300' : 'text-primary'} bg-black/40 shadow-md px-3 py-1 rounded-full`}>
                            {offer.discountType === 'fixed'
                                ? `₹${offer.discountValue}`
                                : `${offer.discountValue}%`
                            }
                            <span className="font-semibold"> OFF</span>
                        </span>
                    </div>
                    <p className="text-white/80 text-sm mb-4">
                        {offer.description}
                    </p>
                </div>
                
                <div className="mt-auto">
                {isUsed ? (
                     <div className="text-center">
                        <p className="text-sm font-bold text-red-400 bg-red-500/20 py-1 px-3 rounded-full inline-block">
                            Coupon Used
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-4">
                        {isMultiUse && (
                            <p className="text-xs font-semibold text-violet-300 bg-violet-500/20 px-2 py-1 rounded-full">
                                {remainingUses} use(s) remaining
                            </p>
                        )}
                        <button 
                            onClick={handleUseCoupon}
                            className="w-full bg-primary text-white font-bold font-heading py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            Use in Cart
                        </button>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

const CouponCardSkeleton: React.FC = () => (
    <div className="bg-black/50 backdrop-blur-lg rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-28">
            <div className="flex justify-between items-start mb-4">
                <div className="h-10 bg-gray-600/30 rounded w-1/2"></div>
                <div className="h-10 bg-gray-600/30 rounded-full w-1/4"></div>
            </div>
            <div className="h-4 bg-gray-600/30 rounded w-full mt-4"></div>
            <div className="h-4 bg-gray-600/30 rounded w-5/6 mt-2"></div>
        </div>
    </div>
);

const CouponsPage: React.FC = () => {
    const [availableCoupons, setAvailableCoupons] = useState<Offer[]>([]);
    const [usedCoupons, setUsedCoupons] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchAllCoupons = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const allCoupons = await getAllStudentCoupons(user.id);
                setAvailableCoupons(allCoupons.filter(c => !c.isUsed));
                setUsedCoupons(allCoupons.filter(c => c.isUsed));
            } catch (error) {
                console.error("Failed to fetch coupon data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllCoupons();
    }, [user]);
    
    if (loading) {
        return (
            <div>
                <div className="h-9 bg-black/50 rounded-lg w-1/2 mb-8 animate-pulse"></div>
                <div className="h-8 bg-black/50 rounded-lg w-1/3 mb-4 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CouponCardSkeleton />
                    <CouponCardSkeleton />
                    <CouponCardSkeleton />
                    <CouponCardSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="text-white">
            <h1 className="text-3xl font-bold font-heading mb-8" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>My Coupon Wallet 🎟️</h1>

            <section className="mb-12">
                <h2 className="text-2xl font-bold font-heading mb-4" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>Available Coupons</h2>
                 {availableCoupons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {availableCoupons.map(offer => (
                             <CouponCard key={offer.id} offer={offer} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-black/50 backdrop-blur-lg border border-white/20 rounded-lg p-6">
                        <p>You have no available coupons right now. Earn more by redeeming rewards or reaching spending milestones!</p>
                    </div>
                )}
            </section>
            
            <section>
                <h2 className="text-2xl font-bold font-heading mb-4" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>Used / Expired</h2>
                {usedCoupons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {usedCoupons.map(offer => (
                            <CouponCard key={offer.id} offer={offer} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-black/50 backdrop-blur-lg border border-white/20 rounded-lg p-6">
                        <p>Your used coupons will appear here.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default CouponsPage;