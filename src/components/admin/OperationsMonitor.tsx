import React, { useState, useEffect } from 'react';
import { Activity, Clock, DollarSign, MapPin, User, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { adminService, LiveTrip, TransactionLogEntry, DriverAlert } from '../../services/adminService';

interface TabProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

const Tab: React.FC<TabProps> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${active
                ? 'bg-mipana-navy text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
    >
        {children}
    </button>
);

const OperationsMonitor: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'trips' | 'transactions' | 'alerts'>('trips');
    const [liveTrips, setLiveTrips] = useState<LiveTrip[]>([]);
    const [transactions, setTransactions] = useState<TransactionLogEntry[]>([]);
    const [alerts, setAlerts] = useState<DriverAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const loadData = async () => {
        setLoading(true);
        try {
            const [tripsData, txData, alertsData] = await Promise.all([
                adminService.getLiveTrips(),
                adminService.getTransactionLog(50),
                adminService.getDriverAlerts(),
            ]);
            setLiveTrips(tripsData);
            setTransactions(txData);
            setAlerts(alertsData);
            setLastUpdate(new Date());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Subscribe to real-time updates for trips
        const unsubscribe = adminService.subscribeToLiveTrips(setLiveTrips);

        // Refresh every 30 seconds
        const interval = setInterval(loadData, 30000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'REQUESTED':
            case 'MATCHING':
                return 'bg-yellow-100 text-yellow-800';
            case 'ACCEPTED':
                return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS':
                return 'bg-green-100 text-green-800';
            case 'COMPLETED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getSeverityColor = (severity: 'warning' | 'critical') => {
        return severity === 'critical'
            ? 'bg-red-100 text-red-800 border-red-200'
            : 'bg-orange-100 text-orange-800 border-orange-200';
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                        <Activity size={20} className="text-cyan-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">Monitor de Operaciones</h2>
                        <p className="text-xs text-gray-500">
                            Actualizado: {lastUpdate.toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                <button
                    onClick={loadData}
                    disabled={loading}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <Tab active={activeTab === 'trips'} onClick={() => setActiveTab('trips')}>
                    <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        Viajes {liveTrips.length > 0 && `(${liveTrips.length})`}
                    </div>
                </Tab>
                <Tab active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>
                    <div className="flex items-center gap-2">
                        <DollarSign size={14} />
                        Transacciones
                    </div>
                </Tab>
                <Tab active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')}>
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={14} />
                        Alertas {alerts.length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {alerts.length}
                            </span>
                        )}
                    </div>
                </Tab>
            </div>

            {/* Content */}
            <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
                {activeTab === 'trips' && (
                    <div className="space-y-3">
                        {liveTrips.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <MapPin size={40} className="mx-auto mb-3 opacity-50" />
                                <p>No hay viajes activos en este momento</p>
                            </div>
                        ) : (
                            liveTrips.map(trip => (
                                <div
                                    key={trip.id}
                                    className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(trip.status)}`}>
                                            {trip.status}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(trip.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-400 text-xs">Pasajero</p>
                                            <p className="font-medium">{trip.passenger_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Conductor</p>
                                            <p className="font-medium">{trip.driver_name || 'Buscando...'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                        <div className="flex items-start gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                                            <span className="truncate">{trip.origin}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1"></div>
                                            <span className="truncate">{trip.destination}</span>
                                        </div>
                                    </div>

                                    {trip.matching_attempt > 0 && (
                                        <div className="mt-2 text-xs text-orange-600">
                                            🔍 Intento de matching: {trip.matching_attempt}/3
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="space-y-2">
                        {transactions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <FileText size={40} className="mx-auto mb-3 opacity-50" />
                                <p>No hay transacciones recientes</p>
                            </div>
                        ) : (
                            transactions.map(tx => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'trip' ? 'bg-blue-100 text-blue-600' :
                                                tx.type === 'recharge' ? 'bg-green-100 text-green-600' :
                                                    'bg-orange-100 text-orange-600'
                                            }`}>
                                            {tx.type === 'trip' ? <MapPin size={14} /> :
                                                tx.type === 'recharge' ? <DollarSign size={14} /> :
                                                    <RefreshCw size={14} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{tx.reference}</p>
                                            <p className="text-xs text-gray-500">{tx.user_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-600">
                                            ${tx.amount_usd.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="space-y-3">
                        {alerts.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <AlertTriangle size={40} className="mx-auto mb-3 opacity-50" />
                                <p>No hay alertas activas 🎉</p>
                            </div>
                        ) : (
                            alerts.map((alert, i) => (
                                <div
                                    key={`${alert.driver_id}-${i}`}
                                    className={`p-4 rounded-xl border ${getSeverityColor(alert.severity)}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold">{alert.driver_name}</span>
                                        <span className="text-xs uppercase font-bold">
                                            {alert.severity === 'critical' ? '⚠️ Crítico' : '⚡ Advertencia'}
                                        </span>
                                    </div>
                                    <p className="text-sm">{alert.details}</p>
                                    <p className="text-xs mt-2 opacity-70">
                                        Tipo: {alert.alert_type.replace('_', ' ')}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OperationsMonitor;
