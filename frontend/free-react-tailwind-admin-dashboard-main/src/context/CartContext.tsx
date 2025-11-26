import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../service/api';

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (asin: string) => void;
    updateQuantity: (asin: string, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'shopping_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addToCart = (product: Product, quantity: number = 1) => {
        setItems(prevItems => {
            const existingItem = prevItems.find(item => item.product.asin === product.asin);
            
            if (existingItem) {
                // Update quantity if item already exists
                return prevItems.map(item =>
                    item.product.asin === product.asin
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                return [...prevItems, { product, quantity }];
            }
        });
    };

    const removeFromCart = (asin: string) => {
        setItems(prevItems => prevItems.filter(item => item.product.asin !== asin));
    };

    const updateQuantity = (asin: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(asin);
            return;
        }

        setItems(prevItems =>
            prevItems.map(item =>
                item.product.asin === asin
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
        try {
            localStorage.removeItem(CART_STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing cart from localStorage:', error);
        }
    };

    const getTotal = () => {
        return items.reduce((total, item) => {
            return total + (item.product.price || 0) * item.quantity;
        }, 0);
    };

    const getItemCount = () => {
        return items.reduce((count, item) => count + item.quantity, 0);
    };

    const value = {
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
