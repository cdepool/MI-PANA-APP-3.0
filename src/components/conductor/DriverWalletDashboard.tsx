import React, { useState, useEffect } from 'react';
import {
    Wallet as WalletIcon, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
    RefreshCw, History, Filter, ChevronLeft, ChevronRight,
    ArrowRight, CreditCard, Activity, PieChart as PieChartIcon, Landmark, Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { walletService } from '../../services/walletService';
import TransactionDetailModal from '../TransactionDetailModal';

interface DriverWalletDashboardProps {
    userId: string;
    userName?: string;
}

export const DriverWalletDashboard: React.FC<DriverWalletDashboardProps> = ({ userId, userName = 'Conductor' }) => {
    const [wallet, setWallet] = useState<any>(null);
    const [exchangeRate, setExchangeRate] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

    useEffect(() => {
        fetchWalletBalance();
        fetchTransactions();
    }, [userId]);

    const fetchWalletBalance = async () => {
        setIsLoading(true);
        try {
            const data = await walletService.getBalance(userId);
            if (data) {
                setWallet(data.wallet);
                setExchangeRate(data.exchange_rate);
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            // Using a default filter 'all' and pagination parameters
            const response = await walletService.getTransactions(userId, 'all', 1, 10);
            setTransactions(response.transactions || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    // Prepare chart data from transactions (or empty state if none)
    const chartData = transactions.length > 0
        ? transactions.slice(0, 7).reverse().map(tx => ({
            day: new Date(tx.created_at).toLocaleDateString('es-VE', { weekday: 'short' }),
            value: tx.amount_usd
        }))
        : [
            { day: 'Lun', value: 0 },
            { day: 'Mar', value: 0 },
            { day: 'Mie', value: 0 },
            { day: 'Jue', value: 0 },
            { day: 'Vie', value: 0 },
            { day: 'Sab', value: 0 },
            { day: 'Dom', value: 0 },
        ];

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-8 animate-pulse">
                <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
                    <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 space-y-8">
            {/* Driver Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-mipana-darkBlue rounded-2xl flex items-center justify-center shadow-lg">
                        <Landmark size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-mipana-darkBlue dark:text-white">Mi Cartera Operativa</h1>
                        <p className="text-[10px] font-bold text-mipana-orange uppercase tracking-widest">Panel de Conductor: {userName}</p>
                    </div>
                </div>
            </motion.div>

            {/* Liquidation Card */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden bg-gradient-to-br from-[#011e45] via-[#00357a] to-[#011e45] rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Por Liquidar (Neto)</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-5xl font-black tracking-tighter">${(wallet?.balance_usd || 0).toFixed(2)}</h2>
                                <span className="text-xl font-bold text-mipana-orange">USD</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Hoy Bruto</p>
                                <p className="text-lg font-bold">$42.50</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Comisión App</p>
                                <p className="text-lg font-bold text-red-400">-$6.37</p>
                            </div>
                        </div>

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="w-full bg-mipana-orange text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2">
                            Solicitar Liquidación Inmediata <ArrowRight size={18} />
                        </motion.button>
                    </div>

                    <div className="h-40 w-full relative bg-black/20 rounded-3xl p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#011e45', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#9ca3af', fontSize: '10px', marginBottom: '4px' }}
                                    formatter={(value: number) => [`$${value}`, 'Ingreso']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#fb923c"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        <p className="text-[10px] text-center mt-2 font-bold text-gray-500 uppercase tracking-widest">Ingresos última semana</p>
                    </div>
                </div>
            </motion.div>

            {/* Driver Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Viajes Hoy', val: '14', icon: <Activity className="text-blue-500" /> },
                    { label: 'Tasa BCV', val: `Bs. ${exchangeRate.toFixed(2)}`, icon: <TrendingUp className="text-green-500" /> },
                    { label: 'Nivel Conductor', val: 'PRO ++', icon: <Percent className="text-orange-500" /> }
                ].map((stat, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl">{stat.icon}</div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-lg font-black text-mipana-darkBlue dark:text-white">{stat.val}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-black text-mipana-darkBlue dark:text-white tracking-tight flex items-center gap-2">
                    <History size={22} className="text-mipana-orange" /> Liquidaciones Recientes
                </h3>
                <div className="space-y-3">
                    {transactions.map((tx, idx) => (
                        <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedTransaction(tx)}
                            className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'payment' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    {tx.type === 'payment' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{tx.description}</p>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                                        {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-mipana-darkBlue dark:text-white">${tx.amount_usd.toFixed(2)}</p>
                                <p className="text-[9px] font-bold text-gray-400">Neto tras comisiones</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}
            </AnimatePresence>
        </div>
    );
};
