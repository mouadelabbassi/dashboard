import { useDashboard } from "../../hooks/useDashboard";

export default function EcommerceMetrics() {
    const { stats, loading, error } = useDashboard();

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] animate-pulse">
                        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-red-600 dark:text-red-400">⚠️ {error}</p>
            </div>
        );
    }

    const metrics = [
        {
            icon: "📦",
            title: "Total Products",
            value: stats?.totalProducts || 0,
            change: "+2.5%",
            trend: "up" as const,
            color: "blue"
        },
        {
            icon: "📊",
            title: "Categories",
            value: stats?.totalCategories || 0,
            change: "0%",
            trend: "neutral" as const,
            color: "green"
        },
        {
            icon: "💰",
            title: "Average Price",
            value: `$${stats?.averageGlobalPrice?.toFixed(2) || 0}`,
            change: "+1.3%",
            trend: "up" as const,
            color: "yellow"
        },
        {
            icon: "⭐",
            title: "Average Rating",
            value: stats?.averageGlobalRating?.toFixed(1) || 0,
            change: "+0.2",
            trend: "up" as const,
            color: "purple"
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
            {metrics.map((metric, index) => (
                <div
                    key={index}
                    className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-lg transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-3xl mb-2 block">{metric.icon}</span>
                            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                                {metric.title}
                            </h4>
                            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-800 dark:text-white xl:text-title-md">
                  {metric.value}
                </span>
                                <span className={`text-sm font-medium ${
                                    metric.trend === "up"
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-gray-600 dark:text-gray-400"
                                }`}>
                  {metric.change}
                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}