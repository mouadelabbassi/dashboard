import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const CartIcon: React.FC = () => {
    const { getItemCount } = useCart();
    const itemCount = getItemCount();

    return (
        <Link
            to="/cart"
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Shopping Cart"
        >
            <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l. 4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2. 293 2.293c-.63.63-.184 1. 707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
            </svg>

            {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {itemCount > 99 ? '99+' : itemCount}
                </span>
            )}
        </Link>
    );
};

export default CartIcon;
