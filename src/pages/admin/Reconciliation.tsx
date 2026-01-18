import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    HelpCircle,
    ArrowRightLeft,
    Calendar,
    Search,
    Filter,
    AlertCircle,
    Link as LinkIcon,
    User,
    Wallet,
    Building
} from 'lucide-react';
import { LoadingSpinner } from '../../components/admin/LoadingSpinner';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Reconciliation: React.FC = () => {
    const { user } = useAuth();
    const [bankTx, setBankTx] = useState<any[]>([]);
    const [recharges, setRecharges] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState<any | null>(null);
    const [selectedRecharge, setSelectedRecharge] = useState<any | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [txs, reqs] = await Promise.all([
                adminService.getUnmatchedTransactions(),
                adminService.getPendingRecharges()
            ]);
            setBankTx(txs);
            setRecharges(reqs);
        } catch (error) {
            console.error("Error loading reconciliation data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMatch = async () => {
        if (!selectedTx || !selectedRecharge || !user) return;

        if (!confirm(`¿Estás seguro de conciliar esta transacción de Bs ${selectedTx.amount} con la recarga de ${selectedRecharge.user_name}?`)) {
            return;
        }

        try {
            const success = await adminService.manualReconcile(selectedTx.id, selectedRecharge.id, user.id);
            if (success) {
                toast.success('Conciliación completada exitosamente');
                setSelectedTx(null);
                setSelectedRecharge(null);
                loadData();
            } else {
                toast.error('Error al procesar la conciliación');
            }
        } catch (error) {
            console.error("Match error", error);
            toast.error('Error al procesar la conciliación');
        }
    };

    if (isLoading) {
        return <LoadingSpinner message="Cargando datos de conciliación..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-7 h-7 text-mipana-mediumBlue" />
                    Conciliación Bancaria
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Empareja transacciones bancarias no identificadas con solicitudes de recarga de usuarios
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-280px)]">
                {/* Left Column: Bank Transactions */}
                <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Building size={18} className="text-blue-500" />
                            Transacciones Bancarias (No Conciliadas)
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {bankTx.length > 0 ? (
                            bankTx.map(tx => (
                                <div
                                    key={tx.id}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedTx?.id === tx.id
                                            ? 'border-mipana-mediumBlue bg-blue-50 dark:bg-blue-900/20 shadow-md ring-1 ring-mipana-mediumBlue'
                                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    onClick={() => setSelectedTx(tx)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">Bs {tx.amount.toLocaleString('es-VE')}</span>
                                        <span className="text-[10px] text-gray-500 font-mono">{tx.reference}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{tx.description?.toLowerCase() || 'Sin descripción'}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                            <Calendar size={10} />
                                            {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-40">
                                <CheckCircle2 size={40} className="mb-2 text-green-500" />
                                <p>No hay transacciones por conciliar</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: User Recharges */}
                <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Wallet size={18} className="text-mipana-orange" />
                            Recargas Pendientes (Usuarios)
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {recharges.length > 0 ? (
                            recharges.map(req => (
                                <div
                                    key={req.id}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedRecharge?.id === req.id
                                            ? 'border-mipana-mediumBlue bg-blue-50 dark:bg-blue-900/20 shadow-md ring-1 ring-mipana-mediumBlue'
                                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    onClick={() => setSelectedRecharge(req)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">Ref: {req.reference}</span>
                                        <span className="text-xs font-bold text-mipana-orange">Bs {req.amount_ves?.toLocaleString('es-VE')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                                            {req.user_name[0]}
                                        </div>
                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{req.user_name}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                        <Calendar size={10} />
                                        {format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-40">
                                <CheckCircle2 size={40} className="mb-2 text-green-500" />
                                <p>No hay solicitudes de recarga pendientes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className={`p-6 rounded-xl border-2 transition-all flex flex-col sm:flex-row items-center justify-between gap-6 ${selectedTx && selectedRecharge
                    ? 'bg-blue-50 border-mipana-mediumBlue dark:bg-blue-900/10'
                    : 'bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700 opacity-60'
                }`}>
                <div className="flex items-center gap-8 text-center sm:text-left">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Transacción</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {selectedTx ? `Bs ${selectedTx.amount} (${selectedTx.reference})` : 'Selecciona una transacción'}
                        </span>
                    </div>
                    <ArrowRightLeft className={`${selectedTx && selectedRecharge ? 'text-mipana-mediumBlue' : 'text-gray-300'}`} size={24} />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Recarga</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {selectedRecharge ? `Bs ${selectedRecharge.amount_ves} (${selectedRecharge.user_name})` : 'Selecciona una recarga'}
                        </span>
                    </div>
                </div>

                <button
                    disabled={!selectedTx || !selectedRecharge}
                    onClick={handleMatch}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${selectedTx && selectedRecharge
                            ? 'bg-mipana-mediumBlue text-white hover:bg-mipana-darkBlue shadow-lg hover:scale-105'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <LinkIcon size={20} />
                    Conciliar Ahora
                </button>
            </div>
        </div>
    );
};

export default Reconciliation;
