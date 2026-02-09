interface Props {
    price: number;
    time: string;
    loading: boolean;
}

export function PriceEstimationCard({ price, time, loading }: Props) {
    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <p className="text-sm text-gray-500 mb-1">Precio estimado</p>
                    <h2 className="text-3xl font-bold text-gray-900">${price.toFixed(2)}</h2>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Tiempo est.</p>
                    <p className="text-lg font-semibold text-gray-900">{time}</p>
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
                El precio final puede variar ligeramente según el tráfico.
            </p>
        </div>
    );
}
