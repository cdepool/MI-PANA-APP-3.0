import React, { useState, useEffect } from 'react';
import {
  Wallet, DollarSign, TrendingUp, Plus, ArrowUpRight, ArrowDownRight,
  RefreshCw, History, Filter, ChevronLeft, ChevronRight, QrCode, Camera,
  ArrowRight, CreditCard, Activity, PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis
} from 'recharts';
import TransactionDetailModal from './TransactionDetailModal';
import { WalletQRCode } from './WalletQRCode';
import { WalletQRScanner } from './WalletQRScanner';
import { WalletP2PPayment } from './WalletP2PPayment';
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
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [recipientId, setRecipientId] = useState<string | null>(null);

  // Pagination & Filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const transactionsPerPage = 10;
  const [filterType, setFilterType] = useState<string>('all');

  // Selected transaction for detail modal
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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

  const handleScanResult = (result: string) => {
    setShowScanner(false);
    if (result.startsWith('mipana://pay/')) {
      const scannedUserId = result.replace('mipana://pay/', '');
      if (scannedUserId === userId) {
        toast.error('No puedes enviarte dinero a ti mismo');
        return;
      }
      setRecipientId(scannedUserId);
      // Here we would open the P2P payment flow
      toast.info('Usuario detectado. Preparando envío...');
    } else {
      toast.error('Código QR no válido');
    }
  };

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
          <div className="w-12 h-12 bg-mipana-darkBlue rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Wallet size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-mipana-darkBlue dark:text-white tracking-tight">Mi Billetera</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{userName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowScanner(true)}
            className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-mipana-orange transition-colors"
          >
            <Camera size={20} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQR(true)}
            className="p-3 bg-mipana-orange text-white rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-2 font-bold"
          >
            <QrCode size={20} />
            <span className="hidden sm:inline">Mi QR</span>
          </motion.button>
        </div>
      </motion.div>

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
                  className="flex-1 bg-white text-mipana-darkBlue py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  <Plus size={18} strokeWidth={3} /> Recargar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 text-white py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  <ArrowUpRight size={18} strokeWidth={3} /> Retirar
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
        {showQR && (
          <WalletQRCode
            userId={userId}
            userName={userName}
            onClose={() => setShowQR(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScanner && (
          <WalletQRScanner
            onScan={handleScanResult}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {recipientId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm"
            >
              <WalletP2PPayment
                senderId={userId}
                recipientId={recipientId}
                onSuccess={() => {
                  setRecipientId(null);
                  fetchWalletBalance();
                  fetchTransactions();
                }}
                onCancel={() => setRecipientId(null)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTransaction && (
          <TransactionDetailModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletDashboard;
