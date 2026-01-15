import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, Check, X, RefreshCw, Search } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import Button from '../Button';

interface UnmatchedTransaction {
    id: string;
    reference: string;
    amount: number;
    phone_orig: string;
    bank_orig: string;
    transaction_date: string;
    status: string;
}

interface PendingRecharge {
    id: string;
    user_id: string;
    user_name: string;
    amount_ves: number;
    last_four_digits: string;
    created_at: string;
}

const ReconciliationPanel: React.FC = () => {
    const { user } = useAuth();
    const [unmatchedTx, setUnmatchedTx] = useState<UnmatchedTransaction[]>([]);
    const [pendingRecharges, setPendingRecharges] = useState<PendingRecharge[]>([]);
    const [selectedTx, setSelectedTx] = useState<string | null>(null);
    const [selectedRecharge, setSelectedRecharge] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [reconciling, setReconciling] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load unmatched transactions
            const txData = await adminService.getUnmatchedTransactions();
            setUnmatchedTx(txData);

            // Load pending recharges
            const { data: recharges } = await supabase
                .from('recharge_requests')
                .select('id, user_id, amount_ves, last_four_digits, created_at, user:profiles!user_id(name)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            setPendingRecharges((recharges || []).map(r => ({
                id: r.id,
                user_id: r.user_id,
                user_name: (r.user as any)?.name || 'Usuario',
                amount_ves: r.amount_ves,
                last_four_digits: r.last_four_digits,
                created_at: r.created_at,
            })));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleReconcile = async () => {
        if (!selectedTx || !selectedRecharge || !user) {
            toast.error('Selecciona una transacción y una recarga para vincular');
            return;
        }

        setReconciling(true);
        try {
            const success = await adminService.manualReconcile(selectedTx, selectedRecharge, user.id);

            if (success) {
                toast.success('Reconciliación exitosa');
                setSelectedTx(null);
                setSelectedRecharge(null);
                loadData();
            } else {
                toast.error('Error al reconciliar');
            }
        } finally {
            setReconciling(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <DollarSign size={20} className="text-orange-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">Reconciliación Manual</h2>
                        <p className="text-xs text-gray-500">
                            {unmatchedTx.length} transacciones sin vincular
                        </p>
                    </div>
                </div>

                <button
                    onClick={loadData}
                    disabled={loading}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Unmatched Transactions */}
                <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                        <AlertCircle size={14} className="text-orange-500" />
                        Transacciones Bancarias
                    </h3>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {unmatchedTx.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No hay transacciones sin vincular
                            </div>
                        ) : (
                            unmatchedTx.map(tx => (
                                <button
                                    key={tx.id}
                                    onClick={() => setSelectedTx(tx.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedTx === tx.id
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-mono text-xs text-gray-500">{tx.reference}</span>
                                        <span className="font-bold text-green-600">Bs. {tx.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <span>{tx.phone_orig}</span>
                                        <span className="mx-2">•</span>
                                        <span>{tx.bank_orig}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(tx.transaction_date).toLocaleString()}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Pending Recharges */}
                <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                        <Search size={14} className="text-blue-500" />
                        Recargas Pendientes
                    </h3>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {pendingRecharges.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No hay recargas pendientes
                            </div>
                        ) : (
                            pendingRecharges.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setSelectedRecharge(r.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedRecharge === r.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium">{r.user_name}</span>
                                        <span className="font-bold text-blue-600">Bs. {r.amount_ves.toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Últimos 4 dígitos: <span className="font-mono font-bold">{r.last_four_digits}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(r.created_at).toLocaleString()}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Action Button */}
            {(selectedTx || selectedRecharge) && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            {selectedTx && selectedRecharge ? (
                                <span className="text-green-600 font-medium">
                                    ✓ Listo para vincular
                                </span>
                            ) : (
                                <span className="text-orange-600">
                                    Selecciona {!selectedTx ? 'una transacción' : 'una recarga'}
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSelectedTx(null);
                                    setSelectedRecharge(null);
                                }}
                            >
                                <X size={16} />
                                Cancelar
                            </Button>

                            <Button
                                disabled={!selectedTx || !selectedRecharge || reconciling}
                                onClick={handleReconcile}
                            >
                                {reconciling ? (
                                    <RefreshCw size={16} className="animate-spin" />
                                ) : (
                                    <Check size={16} />
                                )}
                                Vincular y Procesar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReconciliationPanel;
