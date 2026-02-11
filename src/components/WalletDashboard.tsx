import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  Wallet, DollarSign, TrendingUp, Plus, ArrowUpRight, ArrowDownRight,
  RefreshCw, History, Filter, ChevronLeft, ChevronRight,
  ArrowRight, CreditCard, Activity, PieChart, Banknote, Check, AlertCircle
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis
} from 'recharts';
// Lazy load modal
const TransactionDetailModal = lazy(() => import('./TransactionDetailModal'));
import { toast } from 'sonner';
import { walletService } from '../services/walletService';

interface WalletDashboardProps {
  userId: string;
  userName?: string;
  onRecharge: () => void;
}

interface WalletBalance {
  balance_ves: number;
  balance_usd: number;
  status: string;
  ves_equivalent: number;
  usd_equivalent: number;
}

interface Transaction {
  id: string;
  type: string;
  amount_ves: number;
  amount_usd: number;
  description: string;
  created_at: string;
  status: string;
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ userId, userName = 'Usuario', onRecharge }) => {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const transactionsPerPage = 10;

  // Selected transaction for detail modal
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // trip payment state
  const location = useLocation();
  const navigate = useNavigate();
  const paymentContext = location.state as { type: string, amount: number, serviceName: string, destination: string } | null;
  const [isPayingTrip, setIsPayingTrip] = useState(!!paymentContext);
  const [paymentMode, setPaymentMode] = useState<'FULL_WALLET' | 'MIXED'>('FULL_WALLET');

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
      console.error('Error fetching wallet balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await walletService.getTransactions(userId, filterType, currentPage, transactionsPerPage);
      setTotalTransactions(response.total);
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  useEffect(() => {
    if (showHistory) fetchTransactions();
  }, [currentPage, filterType, showHistory]);

  // Chart Data Preparation for Recharts
  const chartData = transactions
    .slice(0, 7)
    .reverse()
    .map(tx => ({
      date: new Date(tx.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }),
      amount: tx.amount_usd
    }));

  const formatCurrency = (amount: number, currency: 'VES' | 'USD'): string => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

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
      {/* Header with Animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => isPayingTrip ? setIsPayingTrip(false) : navigate('/')}
            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all"
          >
            <ChevronLeft size={20} className="text-mipana-darkBlue dark:text-white" />
          </button>
          <div>
            <h1 className="text-xl font-black text-mipana-darkBlue dark:text-white tracking-tight">
              {isPayingTrip ? 'Pagar Viaje' : 'Mi Billetera'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{userName}</p>
          </div>
        </div>
      </motion.div>

      {/* TRIP PAYMENT MODAL/VIEW INSIDE DASHBOARD */}
      <AnimatePresence>
        {isPayingTrip && paymentContext && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-mipana-darkBlue to-blue-900 rounded-[2rem] p-6 text-white shadow-2xl space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-mipana-orange/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Resumen del Viaje</p>
                <h2 className="text-xl font-black tracking-tight">{paymentContext.serviceName}</h2>
                <p className="text-xs text-blue-200">{paymentContext.destination}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">${paymentContext.amount.toFixed(2)}</p>
                <p className="text-[10px] text-blue-300 font-bold uppercase">Monto Total</p>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Método de Pago</p>

              <button
                onClick={() => setPaymentMode('FULL_WALLET')}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${paymentMode === 'FULL_WALLET' ? 'border-mipana-orange bg-white/10' : 'border-white/5 bg-black/20'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Wallet size={20} className={paymentMode === 'FULL_WALLET' ? 'text-mipana-orange' : 'text-blue-300'} />
                  <div className="text-left">
                    <p className="text-sm font-bold">Saldo Full Billetera</p>
                    <p className="text-[10px] text-blue-200">Disponible: ${(wallet?.balance_usd || 0).toFixed(2)}</p>
                  </div>
                </div>
                {paymentMode === 'FULL_WALLET' && <Check size={18} className="text-mipana-orange" />}
              </button>

              <button
                onClick={() => setPaymentMode('MIXED')}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${paymentMode === 'MIXED' ? 'border-mipana-orange bg-white/10' : 'border-white/5 bg-black/20'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Banknote size={20} className={paymentMode === 'MIXED' ? 'text-mipana-orange' : 'text-blue-300'} />
                  <div className="text-left">
                    <p className="text-sm font-bold">Pago Mixto</p>
                    <p className="text-[10px] text-blue-200">Saldo + Efectivo ($ USD)</p>
                  </div>
                </div>
                {paymentMode === 'MIXED' && <Check size={18} className="text-mipana-orange" />}
              </button>
            </div>

            {(wallet?.balance_usd || 0) < paymentContext.amount && paymentMode === 'FULL_WALLET' && (
              <div className="bg-orange-500/20 p-4 rounded-2xl border border-orange-500/30 flex items-start gap-3">
                <AlertCircle size={18} className="text-mipana-orange shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">Saldo Insuficiente</p>
                  <p className="text-[11px] text-orange-200">Te faltan ${(paymentContext.amount - (wallet?.balance_usd || 0)).toFixed(2)} USD. Recarga ahora para continuar.</p>
                  <button
                    onClick={onRecharge}
                    className="mt-2 text-xs font-black bg-mipana-orange text-white px-3 py-1.5 rounded-lg shadow-lg active:scale-95 transition-all"
                  >
                    Recargar Saldo
                  </button>
                </div>
              </div>
            )}

            <button
              disabled={(wallet?.balance_usd || 0) < paymentContext.amount && paymentMode === 'FULL_WALLET'}
              onClick={() => {
                toast.success('¡Viaje confirmado! Buscando conductor...');
                navigate(`/traslados/activo/${crypto.randomUUID()}`);
              }}
              className="w-full py-4 bg-white text-mipana-darkBlue rounded-2xl font-black text-lg shadow-xl shadow-black/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {paymentMode === 'MIXED' ? 'Pagar y Continuar' : 'Confirmar con Saldo'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Balance Card (Glassmorphism) */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-mipana-darkBlue to-[#00357a] rounded-[2.5rem] transform rotate-1 group-hover:rotate-0 transition-transform duration-500 opacity-20 -z-10"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-gradient-to-br from-mipana-darkBlue via-[#011e45] to-black rounded-[2rem] p-8 text-white shadow-2xl"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-mipana-orange/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] -ml-24 -mb-24"></div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Saldo Disponible</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-5xl font-black tracking-tighter">${(wallet?.balance_usd || 0).toFixed(2)}</h2>
                  <span className="text-xl font-bold text-gray-500">USD</span>
                </div>
                <p className="text-sm font-medium text-mipana-orange mt-1">
                  ≈ {formatCurrency(wallet?.balance_usd ? wallet.balance_usd * exchangeRate : 0, 'VES')}
                </p>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRecharge}
                  className="w-full bg-white text-mipana-darkBlue py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  <Plus size={18} strokeWidth={3} /> Recargar Saldo
                </motion.button>
              </div>
            </div>

            <div className="h-32 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#011e45', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    labelStyle={{ color: '#9ca3af', fontSize: '10px', marginBottom: '4px' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#fb923c"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute top-0 right-0 flex items-center gap-1 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <Activity size={12} className="text-green-400" />
                <span className="text-[10px] font-bold uppercase">Tendencia</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4"
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
            <TrendingUp size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasa Oficial BCV</p>
            <p className="text-lg font-black text-mipana-darkBlue dark:text-white">Bs. {exchangeRate.toFixed(2)} / $</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4"
        >
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl">
            <PieChart size={24} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo en Bolívares</p>
            <p className="text-lg font-black text-mipana-darkBlue dark:text-white">{formatCurrency(wallet?.balance_ves || 0, 'VES')}</p>
          </div>
        </motion.div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-mipana-darkBlue dark:text-white tracking-tight flex items-center gap-2">
            <History size={20} className="text-mipana-orange" />
            Actividad Reciente
          </h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {showHistory ? 'Colapsar' : 'Ver Todas'}
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {transactions.slice(0, showHistory ? undefined : 5).map((tx, idx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedTransaction(tx)}
              className="bg-white dark:bg-gray-800 p-4 rounded-2xl hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'recharge' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                  {tx.type === 'recharge' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white group-hover:text-mipana-orange transition-colors">
                    {tx.description}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-black ${tx.type === 'recharge' ? 'text-green-600' : 'text-gray-900 dark:text-white'
                  }`}>
                  {tx.type === 'recharge' ? '+' : '-'}${tx.amount_usd.toFixed(2)}
                </p>
                <p className="text-[10px] font-bold text-gray-400">Bs. {tx.amount_ves.toFixed(2)}</p>
              </div>
            </motion.div>
          ))}

          {transactions.length === 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-12 rounded-[2rem] text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
              <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Sin movimientos</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {selectedTransaction && (
          <Suspense fallback={null}>
            <TransactionDetailModal
              transaction={selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletDashboard;
