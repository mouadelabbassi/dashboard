import { useState, useEffect } from 'react';
import { getAllProducts, Product } from '../service/api';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllProducts();
            setProducts(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    return { products, loading, error, refetch: fetchProducts };
};