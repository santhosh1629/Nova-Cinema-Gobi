import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MenuItem, CartItem } from '../../types';
import { toggleFavoriteItem, getOwnerStatus } from '../../services/mockApi';
import { useAuth } from '../../context/AuthContext';
import { useMenu } from '../../context/MenuContext';

const getCartFromStorage = (): CartItem[] => {
    try {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    } catch {
        return [];
    }
};

const saveCartToStorage = (cart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

// --- Sub-components ---

// Memoized Card for 60FPS scrolling performance
const ScreenItemCard = React.memo(({ 
    item, 
    onCardClick,
    onToggleFavorite,
    onAddToCart
}: { 
    item: MenuItem; 
    onCardClick: (item: MenuItem) => void;
    onToggleFavorite: (itemId: string, isFavorited: boolean) => void;
    onAddToCart: (item: MenuItem) => void;
}) => {
    const { id, name, price, imageUrl, description, isFavorited, emoji, isAvailable } = item;
    const [isAdding, setIsAdding] = useState(false);
    const [isAnimatingFavorite, setIsAnimatingFavorite] = useState(false);
    const { user, promptForPhone } = useAuth();

    const handleAddToCartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Safety check
        if (!isAvailable) {
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Experience currently unavailable', type: 'cart-warn' } }));
            return;
        }

        // For screens, "+" button acts as a shortcut to details/config
        onAddToCart(item);
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const action = () => {
            if (!isFavorited) { 
                setIsAnimatingFavorite(true);
                setTimeout(() => setIsAnimatingFavorite(false), 500);
            }
            onToggleFavorite(id, isFavorited ?? false);
        };

        if (user) {
            action();
        } else {
            promptForPhone(action);
        }
    };
    
    return (
        <div onClick={() => onCardClick(item)} className={`bg-indigo-950/40 backdrop-blur-lg border border-indigo-500/30 rounded-2xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-indigo-500/20 hover:bg-indigo-900/40 hover:-translate-y-1 cursor-pointer ${!isAvailable ? 'opacity-60' : ''}`}>
            <div className="relative aspect-video overflow-hidden bg-black/40">
                <img src={imageUrl} alt={name} loading="lazy" className={`w-full h-full object-cover transition-transform duration-500 ${isAvailable ? 'hover:scale-110' : 'grayscale-[0.5]'}`} />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {isAvailable ? (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full text-white shadow-lg bg-green-500 shadow-green-500/20 backdrop-blur-md">
                            AVAILABLE NOW
                        </span>
                    ) : (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full text-white shadow-lg bg-red-600 shadow-red-600/20 backdrop-blur-md uppercase">
                            OFFLINE
                        </span>
                    )}
                </div>
                <button 
                    onClick={handleFavoriteClick}
                    className="absolute top-2 right-2 bg-black/40 backdrop-blur-md p-2 rounded-full text-lg transition-transform active:scale-90 hover:bg-black/60"
                    aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <span className={isAnimatingFavorite ? 'animate-heart-pop block' : 'block'}>
                        {isFavorited ? '❤️' : '🤍'}
                    </span>
                </button>
            </div>
            <div className="p-4 text-white">
                <h3 className="font-bold font-heading text-lg truncate mb-1">{emoji} {name}</h3>
                <p className="text-xs text-gray-300 line-clamp-2 h-8">{description}</p>
                <div className="flex justify-between items-center mt-3">
                    <p className="font-black font-heading text-amber-400 text-xl">₹{price}</p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAddToCartClick}
                            disabled={!isAvailable}
                            className={`${isAvailable ? 'bg-indigo-600 shadow-indigo-600/30' : 'bg-gray-700 text-gray-400 pointer-events-none opacity-60'} text-white font-bold rounded-full p-2.5 shadow-xl transition-all duration-200 ${isAvailable ? 'hover:scale-110 active:scale-90' : ''} ${isAdding ? 'animate-cart-bounce' : ''}`}
                            aria-label={isAvailable ? "View Details and Book" : "Experience Unavailable"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

const GamesPage: React.FC = () => {
    // Global Menu State from Context (0ms load from cache)
    const { menuItems, loading: menuLoading, refreshMenu, updateMenuItemOptimistic } = useMenu();
    
    const [filteredMenu, setFilteredMenu] = useState<MenuItem[]>([]);
    const [isCanteenOnline, setIsCanteenOnline] = useState(true);
    
    const { user } = useAuth();
    const navigate = useNavigate();

    // Initial Status Check
    useEffect(() => {
        const checkStatus = async () => {
            const status = await getOwnerStatus();
            setIsCanteenOnline(status.isOnline);
        };
        checkStatus();
    }, []);

    // Filter Logic - Memoized for performance
    useEffect(() => {
        const items = menuItems.filter(item => item.category === 'game');
        setFilteredMenu(items);
    }, [menuItems]);

    const handleCardClick = useCallback((item: MenuItem) => {
        navigate(`/customer/menu/${item.id}`, { state: { item } });
    }, [navigate]);

    const handleToggleFavorite = useCallback(async (itemId: string, isFavorited: boolean) => {
        if (!user) return;
        
        const item = menuItems.find(i => i.id === itemId);
        if (item) {
            updateMenuItemOptimistic({ 
                ...item, 
                isFavorited: !isFavorited, 
                favoriteCount: (item.favoriteCount || 0) + (!isFavorited ? 1 : -1) 
            });
        }
        
        try {
            await toggleFavoriteItem(user.id, itemId);
        } catch (error) {
            console.error("Failed to toggle favorite", error);
            if (item) {
                updateMenuItemOptimistic(item);
            }
        }
    }, [user, menuItems, updateMenuItemOptimistic]);

    const handleAddToCartShortcut = useCallback((item: MenuItem) => {
        // Safety check for shortcut
        if (!item.isAvailable) return;
        // For screens, we redirect to the details page so the user can select a slot
        handleCardClick(item);
    }, [handleCardClick]);

    
    return (
        <div>
            <div className="pt-4 min-h-[60vh]">
                <h1 className="text-3xl font-bold font-heading mb-6 text-white text-center" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                    Screens & Experiences 🎬
                </h1>

                {/* Show Skeleton if loading AND no cached data. */}
                {menuLoading && filteredMenu.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
                        <div className="bg-surface/30 rounded-2xl overflow-hidden shadow-sm h-64"></div>
                        <div className="bg-surface/30 rounded-2xl overflow-hidden shadow-sm h-64"></div>
                        <div className="bg-surface/30 rounded-2xl overflow-hidden shadow-sm h-64"></div>
                    </div>
                ) : filteredMenu.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20 animate-fade-in-up">
                        {filteredMenu.map(item => (
                            <ScreenItemCard 
                                key={item.id} 
                                item={item} 
                                onCardClick={handleCardClick}
                                onToggleFavorite={handleToggleFavorite}
                                onAddToCart={handleAddToCartShortcut}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-indigo-200 opacity-70">
                        <div className="text-4xl mb-2">🎬</div>
                        <p className="font-medium">No screens available right now.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GamesPage;