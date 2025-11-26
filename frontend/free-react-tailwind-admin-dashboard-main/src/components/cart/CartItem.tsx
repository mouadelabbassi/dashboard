import React from 'react';
import { CartItem as CartItemType } from '../../context/CartContext';

interface CartItemProps {
    item: CartItemType;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
    const { product, quantity } = item;
    const subtotal = (product.price || 0) * quantity;

    return (
        <div className="flex gap-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            {/* Product Image */}
            <div className="w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/100?text=No+Image';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {product.productName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    ASIN: {product.asin}
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600">
                        ${product.price?.toFixed(2) || '0.00'}
                    </span>
                    <span className="text-sm text-gray-500">each</span>
                </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex flex-col items-end justify-between">
                <button
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove from cart"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <button
                            onClick={() => onUpdateQuantity(Math.max(1, quantity - 1))}
                            className="px-3 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-lg"
                        >
                            -
                        </button>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => onUpdateQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 text-center bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white"
                        />
                        <button
                            onClick={() => onUpdateQuantity(quantity + 1)}
                            className="px-3 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-lg"
                        >
                            +
                        </button>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Subtotal</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                            ${subtotal.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartItem;
