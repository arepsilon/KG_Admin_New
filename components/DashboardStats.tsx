export default function DashboardStats({ stats }: { stats: any }) {
    const cards = [
        {
            title: 'Total Orders',
            value: stats.totalOrders,
            bgColor: 'bg-white',
            textColor: 'text-slate-700',
            valueColor: 'text-slate-900',
        },
        {
            title: 'Total Revenue',
            value: `₹${stats.totalRevenue.toFixed(2)}`,
            bgColor: 'bg-white',
            textColor: 'text-slate-700',
            valueColor: 'text-emerald-600',
        },
        {
            title: 'Customers',
            value: stats.totalCustomers,
            bgColor: 'bg-white',
            textColor: 'text-slate-700',
            valueColor: 'text-slate-900',
        },
        {
            title: 'Restaurants',
            value: stats.totalRestaurants,
            bgColor: 'bg-white',
            textColor: 'text-slate-700',
            valueColor: 'text-slate-900',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <div key={index} className={`${card.bgColor} rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow`}>
                    <p className={`text-sm font-medium ${card.textColor} mb-2`}>{card.title}</p>
                    <p className={`text-3xl font-bold ${card.valueColor}`}>{card.value}</p>
                </div>
            ))}
        </div>
    );
}
