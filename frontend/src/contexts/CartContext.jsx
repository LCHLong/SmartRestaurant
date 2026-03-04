import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        // Load cart from localStorage on init
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [existingOrderCount, setExistingOrderCount] = useState(0);

    useEffect(() => {
        const addingToOrder = localStorage.getItem('addToOrderId');
        if (addingToOrder) {
            const fetchExistingOrder = async () => {
                try {
                    const response = await api.get(`/api/orders/${addingToOrder}`);
                    if (response.data.success && response.data.data.items) {
                        const count = response.data.data.items.reduce((sum, item) => sum + item.quantity, 0);
                        setExistingOrderCount(count);
                    }
                } catch (error) {
                    console.error('Failed to fetch existing order count:', error);
                }
            };
            fetchExistingOrder();
        } else {
            setExistingOrderCount(0);
        }
    }, [cart]); // Refresh if cart changes or component mounts

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item, quantity = 1, modifiers = [], notes = '') => {
        setCart(prevCart => {
            // Check if item already exists with SAME modifiers
            const existingIndex = prevCart.findIndex(cartItem => {
                if (cartItem.id !== item.id) return false;
                if (cartItem.modifiers?.length !== modifiers.length) return false;

                // Compare modifier IDs
                const currentModIds = (cartItem.modifiers || []).map(m => m.id).sort().join(',');
                const newModIds = modifiers.map(m => m.id).sort().join(',');
                return currentModIds === newModIds;
            });

            if (existingIndex > -1) {
                // Update quantity for exactly same item + modifiers
                const newCart = [...prevCart];
                newCart[existingIndex].quantity += quantity;
                return newCart;
            } else {
                // Add new item (unique combination of item + modifiers)
                return [...prevCart, {
                    ...item,
                    quantity,
                    modifiers,
                    notes,
                    cartId: Date.now() + Math.random().toString(36).substr(2, 9) // More robust ID
                }];
            }
        });
    };

    const removeFromCart = (cartId) => {
        setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
    };

    const updateQuantity = (cartId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(cartId);
            return;
        }
        setCart(prevCart =>
            prevCart.map(item =>
                item.cartId === cartId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => {
            const modifiersPrice = (item.modifiers || []).reduce((sum, mod) => sum + Number(mod.price_modifier || 0), 0);
            return total + ((Number(item.price) + modifiersPrice) * item.quantity);
        }, 0);
    };

    const getCartCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0) + existingOrderCount;
    };

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartCount,
            existingOrderCount,
            setExistingOrderCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
