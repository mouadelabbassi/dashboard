import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../service/api';

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (asin: string) => void;
    updateQuantity: (asin: string, quantity: number) => void;
    clearCart: () => void;
    getItemCount: () => number;
    getTotal: () => number;
    isInCart: (asin: string) => boolean;
    getItemQuantity: (asin: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>(() => {
        // Load cart from localStorage on init
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (product: Product, quantity: number = 1) => {
        setItems(prevItems => {
            const existingItem = prevItems.find(item => item.product.asin === product.asin);
            if (existingItem) {
                return prevItems.map(item =>
                    item.product.asin === product.asin
                        ?  { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevItems, { product, quantity }];
        });
    };

    const removeFromCart = (asin: string) => {
        setItems(prevItems => prevItems.filter(item => item.product.asin !== asin));
    };

    const updateQuantity = (asin: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(asin);
            return;
        }
        setItems(prevItems =>
            prevItems.map(item =>
                item.product.asin === asin ?  { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const getItemCount = (): number => {
        return items.reduce((total, item) => total + item.quantity, 0);
    };

    const getTotal = (): number => {
        return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    };

    const isInCart = (asin: string): boolean => {
        return items.some(item => item.product.asin === asin);
    };

    const getItemQuantity = (asin: string): number => {
        const item = items.find(item => item.product.asin === asin);
        return item ? item.quantity : 0;
    };

    const value: CartContextType = {
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemCount,
        getTotal,
        isInCart,
        getItemQuantity,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};