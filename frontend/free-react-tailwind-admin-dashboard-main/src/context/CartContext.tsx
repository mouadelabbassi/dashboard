import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '../service/api';

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productAsin: string) => void;
    updateQuantity: (productAsin: string, quantity: number) => void;
    clearCart: () => void;
    getItemCount: () => number;
    getSubtotal: () => number;
    isInCart: (productAsin: string) => boolean;
    getItemQuantity: (productAsin: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'shopping_cart';

export const CartProvider: React. FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const storedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (storedCart) {
                const parsed = JSON.parse(storedCart);
                setItems(parsed);
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            localStorage.removeItem(CART_STORAGE_KEY);
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console. error('Error saving cart to storage:', error);
        }
    }, [items]);

    const addToCart = useCallback((product: Product, quantity: number = 1) => {
        setItems(currentItems => {
            const existingItem = currentItems.find(item => item.product.asin === product.asin);

            if (existingItem) {
                // Update quantity if item exists
                return currentItems.map(item =>
                    item.product.asin === product.asin
                        ?  { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                return [... currentItems, { product, quantity }];
            }
        });
    }, []);

    const removeFromCart = useCallback((productAsin: string) => {
        setItems(currentItems => currentItems.filter(item => item.product. asin !== productAsin));
    }, []);

    const updateQuantity = useCallback((productAsin: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(productAsin);
            return;
        }

        setItems(currentItems =>
            currentItems. map(item =>
                item.product. asin === productAsin
                    ?  { ...item, quantity }
                    : item
            )
        );
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const getItemCount = useCallback(() => {
        return items.reduce((total, item) => total + item. quantity, 0);
    }, [items]);

    const getSubtotal = useCallback(() => {
        return items.reduce((total, item) => {
            const price = item.product.price || 0;
            return total + (price * item.quantity);
        }, 0);
    }, [items]);

    const isInCart = useCallback((productAsin: string) => {
        return items.some(item => item.product.asin === productAsin);
    }, [items]);

    const getItemQuantity = useCallback((productAsin: string) => {
        const item = items.find(item => item. product.asin === productAsin);
        return item ? item.quantity : 0;
    }, [items]);

    const value = {
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemCount,
        getSubtotal,
        isInCart,
        getItemQuantity
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