import React, { useEffect, useState } from 'react';
import { Clock, Monitor, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { AccessLog } from '../../../types';
import { passengerService } from '../../../services/passengerService';

interface AccessHistoryTableProps {
    userId: string;
    limit?: number;
}

const AccessHistoryTable: React.FC<AccessHistoryTableProps> = ({
    userId,
    limit = 10,
}) => {
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [userId]);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const history = await passengerService.getAccessHistory(userId, limit);
            setLogs(history);
        } catch (error) {
            console.error('Error loading access history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getAccessTypeLabel = (type: AccessLog['accessType']): string => {
        const labels: Record<AccessLog['accessType'], string> = {
            LOGIN: 'Inicio de sesión',
            LOGOUT: 'Cierre de sesión',
            PASSWORD_CHANGE: 'Cambio de PIN',
            PROFILE_UPDATE: 'Actualización de perfil',
        };
        return labels[type];
    };

    const getAccessTypeColor = (type: AccessLog['accessType']): string => {
        const colors: Record<AccessLog['accessType'], string> = {
            LOGIN: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400',
            PASSWORD_CHANGE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            PROFILE_UPDATE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        };
        return colors[type];
    };

    const formatTimestamp = (date: Date): { date: string; time: string } => {
        const dateObj = new Date(date);
        return {
            date: dateObj.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: dateObj.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mipana-mediumBlue"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-mipana-mediumBlue" />
                Historial de Acceso
            </h3>

            {logs.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                        No hay registros de acceso disponibles
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {logs.map((log) => {
                        const timestamp = formatTimestamp(log.timestamp);

                        return (
                            <div
                                key={log.id}
                                className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                {/* Status Icon */}
                                <div className="mt-1">
                                    {log.success ? (
                                        <CheckCircle size={20} className="text-green-500" />
                                    ) : (
                                        <XCircle size={20} className="text-red-500" />
                                    )}
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getAccessTypeColor(log.accessType)}`}>
                                            {getAccessTypeLabel(log.accessType)}
                                        </span>
                                        {!log.success && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                Fallido
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {timestamp.date} a las {timestamp.time}
                                        </span>

                                        {log.browser && log.os && (
                                            <span className="flex items-center gap-1">
                                                <Monitor size={12} />
                                                {log.browser} · {log.os}
                                            </span>
                                        )}

                                        {log.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin size={12} />
                                                {log.location}
                                            </span>
                                        )}
                                    </div>

                                    {log.ipAddress && (
                                        <p className="text-xs text-gray-500 font-mono mt-1">
                                            IP: {log.ipAddress}
                                        </p>
                                    )}

                                    {!log.success && log.failureReason && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                            Razón: {log.failureReason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 text-center">
                    Mostrando últimos {logs.length} accesos
                </p>
            </div>
        </div>
    );
};

export default AccessHistoryTable;
