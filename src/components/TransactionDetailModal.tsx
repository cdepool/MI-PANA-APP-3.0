import React from 'react';
import { X, Calendar, DollarSign, Hash, Building2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface TransactionDetailModalProps {
    transaction: {
        id: string;
        type: string;
        amount_ves: number;
        amount_usd: number;
        description: string;
        created_at: string;
        status: string;
        reference?: string;
        bank_transaction_id?: string;
        exchange_rate?: number;
        balance_ves_after: number;
        balance_usd_after: number;
    };
    onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, onClose }) => {
    const formatCurrency = (amount: number, currency: 'VES' | 'USD'): string => {
        return new Intl.NumberFormat('es-VE', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('es-VE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusIcon = () => {
        switch (transaction.status) {
            case 'completed':
                return <CheckCircle className="text-green-600" size={24} />;
            case 'pending':
                return <Clock className="text-yellow-600" size={24} />;
            case 'failed':
                return <AlertCircle className="text-red-600" size={24} />;
            default:
                return <Clock className="text-gray-600" size={24} />;
        }
    };

    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            completed: 'Completada',
            pending: 'Pendiente',
            failed: 'Fallida',
            reversed: 'Revertida',
        };
        return labels[status] || status;
    };

    const getTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
            recharge: 'Recarga',
            payment: 'Pago de viaje',
            refund: 'Reembolso',
            withdrawal: 'Retiro',
            adjustment: 'Ajuste',
        };
        return labels[type] || type;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-br from-mipana-darkBlue to-mipana-mediumBlue p-6 text-white flex items-center justify-between rounded-t-3xl">
                    <div>
                        <h2 className="text-xl font-bold">Detalle de Transacción</h2>
                        <p className="text-sm opacity-80 mt-1">{getTypeLabel(transaction.type)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                        <div className="flex items-center gap-3">
                            {getStatusIcon()}
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                                <p className="font-bold text-gray-900 dark:text-white">{getStatusLabel(transaction.status)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800">
                            <div>
                                <p className="text-sm text-green-700 dark:text-green-400 font-medium">Monto en Bolívares</p>
                                <p className="text-3xl font-black text-green-900 dark:text-green-100">
                                    {formatCurrency(transaction.amount_ves, 'VES')}
                                </p>
                            </div>
                            <DollarSign className="text-green-600 dark:text-green-400" size={32} />
                        </div>

                        {transaction.amount_usd > 0 && (
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                                <div>
                                    <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Monto en Dólares</p>
                                    <p className="text-2xl font-black text-blue-900 dark:text-blue-100">
                                        {formatCurrency(transaction.amount_usd, 'USD')}
                                    </p>
                                </div>
                                <DollarSign className="text-blue-600 dark:text-blue-400" size={28} />
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-900 dark:text-white">Información Detallada</h3>

                        <div className="space-y-2">
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <Calendar className="text-gray-400 mt-0.5" size={18} />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Fecha y Hora</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatDate(transaction.created_at)}</p>
                                </div>
                            </div>

                            {transaction.reference && (
                                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <Hash className="text-gray-400 mt-0.5" size={18} />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Referencia</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{transaction.reference}</p>
                                    </div>
                                </div>
                            )}

                            {transaction.description && (
                                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Descripción</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                                    </div>
                                </div>
                            )}

                            {transaction.exchange_rate && (
                                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <DollarSign className="text-gray-400 mt-0.5" size={18} />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Tasa de Cambio</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            1 USD = {formatCurrency(transaction.exchange_rate, 'VES')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Balance After */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3">Saldo Después de la Transacción</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bolívares</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(transaction.balance_ves_after, 'VES')}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dólares</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(transaction.balance_usd_after, 'USD')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction ID */}
                    <div className="text-center pt-2">
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">ID: {transaction.id}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-3xl">
                    <button
                        onClick={onClose}
                        className="w-full bg-mipana-darkBlue hover:bg-[#001530] text-white py-3 rounded-xl font-bold transition-all active:scale-95"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailModal;
