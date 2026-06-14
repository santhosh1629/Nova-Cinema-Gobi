
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MenuItem, CartItem } from '../../types';
// Fix: 'getDemoMenu' is not exported from mockApi. Using 'getMenu' instead.
import { getMenu } from '../../services/mockApi';

const getCartFromStorage = (): CartItem[] => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
};

const saveCartToStorage = (cart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

const DemoMenuItemCard: React.FC<{ item: MenuItem; onAddToCart: (item: MenuItem) => void; }> = ({ item, onAddToCart }) => {
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToCart(item);
        setIsAdding(true);
        setTimeout(() => setIsAdding(false), 700);
    };
    
    return (
        <div className="bg-black/50 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 group hover:shadow-2xl hover:-translate-y-2">
            <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="p-4">
                <h3 className="font-bold text-lg truncate text-white">{item.emoji} {item.name}</h3>
                <p className="text-sm text-white/70 h-10">{item.description}</p>
                <div className="flex justify-between items-center mt-2">
                    <p className="font-black text-primary text-xl">₹{item.price}</p>
                    <button
                        onClick={handleAddToCartClick}
                        className={`bg-accent text-white rounded-full p-2 transition-transform duration-200 hover:scale-110 active:scale-95 ${isAdding ? 'animate-add-to-cart-pop' : ''}`}
                        aria-label="Add to cart"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

const DemoMenuPage: React.FC = () => {
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDemoData = async () => {
            // Fix: 'getDemoMenu' is not exported from mockApi. Using 'getMenu' instead.
            const demoItems = await getMenu();
            setMenu(demoItems);
        };
        fetchDemoData();
    }, []);

    const handleAddToCart = useCallback((item: MenuItem) => {
        const cart = getCartFromStorage().filter(i => i.isDemo); // Keep other demo items if any
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        if (existingItem) {
            const newCart = cart.map(cartItem =>
                cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1, isDemo: true } : cartItem
            );
            saveCartToStorage(newCart);
        } else {
            const newCart = [...cart, { ...item, quantity: 1, isDemo: true }];
            saveCartToStorage(newCart);
        }
        window.dispatchEvent(new CustomEvent('itemAddedToCart'));
        navigate('/student/cart');
    }, [navigate]);

    return (
        <div className="text-white">
            <div className="bg-primary/20 border border-primary/50 text-center p-4 rounded-lg mb-6">
                <h1 className="text-3xl font-bold">Demo Menu</h1>
                <p className="text-white/80 mt-1">Add an item to your cart to see how the checkout works. This is not a real order.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {menu.map(item => (
                    <DemoMenuItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />
                ))}
            </div>
        </div>
    );
};

export default DemoMenuPage;