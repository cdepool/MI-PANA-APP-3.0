import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    MapPinOff,
    Star,
    Clock,
    ChevronRight,
    ExternalLink,
    ShieldAlert
} from 'lucide-react';
import { adminService, DriverAlert } from '../../services/adminService';

const DriverAlertsPanel: React.FC = () => {
    const [alerts, setAlerts] = useState<DriverAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAlerts = async () => {
            try {
                const data = await adminService.getDriverAlerts();
                setAlerts(data);
            } catch (error) {
                console.error("Error loading driver alerts", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAlerts();

        // Refresh every minute
        const interval = setInterval(loadAlerts, 60000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-xl"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert size={18} className="text-mipana-orange" />
                    Alertas de Conductores
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${alerts.length > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {alerts.length} activas
                </span>
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                {alerts.length > 0 ? (
                    alerts.map((alert, index) => (
                        <div
                            key={`${alert.driver_id}-${index}`}
                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group"
                        >
                            <div className="flex gap-3">
                                <div className={`p-2 rounded-lg shrink-0 ${getAlertColor(alert.severity)}`}>
                                    {getAlertIcon(alert.alert_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {alert.driver_name}
                                        </p>
                                        <ChevronRight size={14} className="text-gray-300 group-hover:text-mipana-mediumBlue transition-colors" />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                        {alert.details}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-10 text-center opacity-40">
                        <AlertTriangle size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-xs">No hay alertas críticas en este momento</p>
                    </div>
                )}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <button className="w-full text-center text-xs font-bold text-mipana-mediumBlue hover:underline flex items-center justify-center gap-1">
                    Ver todas las alertas
                    <ExternalLink size={12} />
                </button>
            </div>
        </div>
    );
};

const getAlertIcon = (type: string) => {
    switch (type) {
        case 'offline_long': return <Clock size={16} />;
        case 'low_rating': return <Star size={16} />;
        case 'rejected_many': return <AlertTriangle size={16} />;
        case 'no_location': return <MapPinOff size={16} />;
        default: return <AlertTriangle size={16} />;
    }
};

const getAlertColor = (severity: string) => {
    return severity === 'critical'
        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
};

export default DriverAlertsPanel;
