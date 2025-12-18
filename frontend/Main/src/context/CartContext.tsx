import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../service/api';

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number) => boolean;
    removeFromCart: (asin: string) => void;
    updateQuantity: (asin: string, quantity: number) => boolean;
    clearCart: () => void;
    getItemCount: () => number;
    getTotal: () => number;
    isInCart: (asin: string) => boolean;
    getItemQuantity: (asin: string) => number;
    getMaxQuantity: (asin: string) => number;
    canAddMore: (asin: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    // Get maximum quantity available for a product
    const getMaxQuantity = (asin: string): number => {
        const item = items.find(item => item.product.asin === asin);
        if (item) {
            return item.product.stockQuantity || 0;
        }
        return 0;
    };

    // Check if we can add more of this product
    const canAddMore = (asin: string): boolean => {
        const item = items.find(item => item.product.asin === asin);
        if (!item) return true;
        const maxStock = item.product.stockQuantity || 0;
        return item.quantity < maxStock;
    };

    const addToCart = (product: Product, quantity: number = 1): boolean => {
        const stockQuantity = product.stockQuantity || 0;

        // Don't allow adding if out of stock
        if (stockQuantity <= 0) {
            return false;
        }

        let added = false;

        setItems(prevItems => {
            const existingItem = prevItems.find(item => item.product.asin === product.asin);

            if (existingItem) {
                const currentQuantity = existingItem.quantity;
                const newQuantity = currentQuantity + quantity;

                // Don't exceed stock
                if (newQuantity > stockQuantity) {
                    // Can only add up to stock limit
                    if (currentQuantity >= stockQuantity) {
                        added = false;
                        return prevItems; // Already at max
                    }
                    added = true;
                    return prevItems.map(item =>
                        item.product.asin === product.asin
                            ? { ...item, quantity: stockQuantity }
                            : item
                    );
                }

                added = true;
                return prevItems.map(item =>
                    item.product.asin === product.asin
                        ? { ...item, quantity: newQuantity }
                        : item
                );
            }

            // New item - respect stock limit
            const addQuantity = Math.min(quantity, stockQuantity);
            added = true;
            return [...prevItems, { product, quantity: addQuantity }];
        });

        return added;
    };

    const removeFromCart = (asin: string) => {
        setItems(prevItems => prevItems.filter(item => item.product.asin !== asin));
    };

    const updateQuantity = (asin: string, quantity: number): boolean => {
        if (quantity < 1) {
            removeFromCart(asin);
            return true;
        }

        let updated = false;

        setItems(prevItems => {
            const item = prevItems.find(i => i.product.asin === asin);
            if (! item) return prevItems;

            const maxStock = item.product.stockQuantity || 0;
            const newQuantity = Math.min(quantity, maxStock);

            if (newQuantity !== quantity) {
                updated = false; // Couldn't update to requested quantity
            } else {
                updated = true;
            }

            return prevItems.map(i =>
                i.product.asin === asin ?  { ...i, quantity: newQuantity } : i
            );
        });

        return updated;
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
        getMaxQuantity,
        canAddMore,
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