import { useState, useEffect } from 'react';
import { getDashboardStats, DashboardStats } from '../service/api';

export const useDashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getDashboardStats();
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch dashboard stats');
        } finally {
            setLoading(false);
        }
    };

    return { stats, loading, error, refetch: fetchDashboardStats };
};