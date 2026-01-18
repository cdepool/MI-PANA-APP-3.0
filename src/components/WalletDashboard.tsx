import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, TrendingUp, Plus, ArrowUpRight, ArrowDownRight, RefreshCw, History, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import TransactionDetailModal from './TransactionDetailModal';

interface WalletDashboardProps {
  userId: string;
  onRecharge: () => void;
  wallet?: WalletBalance | null; // Add wallet prop to pass status
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

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ userId, onRecharge }) => {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const transactionsPerPage = 10;

  // Filter state
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterMinAmount, setFilterMinAmount] = useState<string>('');
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>('');

  // Selected transaction for detail modal
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchWalletBalance();
    fetchTransactions();
  }, [userId]);

  const fetchWalletBalance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-get-balance?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
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
      // Build query parameters
      let query = `user_id=eq.${userId}&order=created_at.desc`;

      // Add filters
      if (filterType !== 'all') {
        query += `&type=eq.${filterType}`;
      }
      if (filterDateFrom) {
        query += `&created_at=gte.${filterDateFrom}T00:00:00`;
      }
      if (filterDateTo) {
        query += `&created_at=lte.${filterDateTo}T23:59:59`;
      }
      if (filterMinAmount) {
        query += `&amount_ves=gte.${filterMinAmount}`;
      }
      if (filterMaxAmount) {
        query += `&amount_ves=lte.${filterMaxAmount}`;
      }

      // Add pagination
      const offset = (currentPage - 1) * transactionsPerPage;
      query += `&limit=${transactionsPerPage}&offset=${offset}`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/wallet_transactions?${query}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Prefer': 'count=exact',
          },
        }
      );

      const data = await response.json();

      // Get total count from Content-Range header
      const contentRange = response.headers.get('Content-Range');
      if (contentRange) {
        const total = parseInt(contentRange.split('/')[1]);
        setTotalTransactions(total);
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Refetch transactions when filters or pagination change
  useEffect(() => {
    if (showTransactions) {
      fetchTransactions();
    }
  }, [currentPage, filterType, filterDateFrom, filterDateTo, filterMinAmount, filterMaxAmount, showTransactions]);

  const formatCurrency = (amount: number, currency: 'VES' | 'USD'): string => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'recharge':
        return <ArrowDownRight size={20} className="text-green-600" />;
      case 'payment':
        return <ArrowUpRight size={20} className="text-red-600" />;
      case 'refund':
        return <ArrowDownRight size={20} className="text-blue-600" />;
      default:
        return <RefreshCw size={20} className="text-gray-600" />;
    }
  };

  const getTransactionLabel = (type: string): string => {
    const labels: Record<string, string> = {
      recharge: 'Recarga',
      payment: 'Pago de viaje',
      refund: 'Reembolso',
      withdrawal: 'Retiro',
      adjustment: 'Ajuste',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Skeleton Loading */}
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="space-y-2">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Wallet size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi Billetera</h1>
            <p className="text-sm text-gray-500">Gestiona tu saldo</p>
          </div>
        </div>
        <button
          onClick={fetchWalletBalance}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Actualizar saldo"
        >
          <RefreshCw size={20} className={`text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* VES Balance */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm opacity-90">Saldo en Bolívares</span>
            <DollarSign size={24} />
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-bold">{formatCurrency(wallet?.balance_ves || 0, 'VES')}</p>
            <p className="text-sm opacity-75">
              ≈ {formatCurrency((wallet?.balance_ves || 0) / exchangeRate, 'USD')}
            </p>
          </div>
        </div>

        {/* USD Balance */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm opacity-90">Saldo en Dólares</span>
            <DollarSign size={24} />
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-bold">{formatCurrency(wallet?.balance_usd || 0, 'USD')}</p>
            <p className="text-sm opacity-75">
              ≈ {formatCurrency((wallet?.balance_usd || 0) * exchangeRate, 'VES')}
            </p>
          </div>
        </div>
      </div>

      {/* Exchange Rate */}
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Tasa de Cambio Oficial</p>
              <p className="text-lg font-bold text-gray-900">
                1 USD = {formatCurrency(exchangeRate, 'VES')}
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400">DolarAPI.com</span>
        </div>
      </div>

      {/* Total Balance */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
        <p className="text-sm opacity-90 mb-2">Saldo Total Equivalente</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs opacity-75">En Bolívares</p>
            <p className="text-2xl font-bold">{formatCurrency(wallet?.ves_equivalent || 0, 'VES')}</p>
          </div>
          <div>
            <p className="text-xs opacity-75">En Dólares</p>
            <p className="text-2xl font-bold">{formatCurrency(wallet?.usd_equivalent || 0, 'USD')}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onRecharge}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Plus size={24} />
          Recargar Saldo
        </button>
        <button
          onClick={() => setShowTransactions(!showTransactions)}
          className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-300 transition-colors"
        >
          <History size={24} />
          Historial
        </button>
      </div>

      {/* Transactions History */}
      {showTransactions && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Historial de Transacciones</h3>
              <button
                onClick={() => setShowTransactions(false)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Ocultar
              </button>
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Filter size={16} />
                <span>Filtros</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="recharge">Recarga</option>
                  <option value="payment">Pago de viaje</option>
                  <option value="refund">Reembolso</option>
                  <option value="withdrawal">Retiro</option>
                  <option value="adjustment">Ajuste</option>
                </select>

                {/* Date From */}
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Desde"
                />

                {/* Date To */}
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Hasta"
                />

                {/* Amount Range */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filterMinAmount}
                    onChange={(e) => { setFilterMinAmount(e.target.value); setCurrentPage(1); }}
                    className="w-1/2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Min Bs."
                  />
                  <input
                    type="number"
                    value={filterMaxAmount}
                    onChange={(e) => { setFilterMaxAmount(e.target.value); setCurrentPage(1); }}
                    className="w-1/2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Max Bs."
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {(filterType !== 'all' || filterDateFrom || filterDateTo || filterMinAmount || filterMaxAmount) && (
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                    setFilterMinAmount('');
                    setFilterMaxAmount('');
                    setCurrentPage(1);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <History size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay transacciones que coincidan con los filtros</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => setSelectedTransaction(tx)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(tx.type)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{getTransactionLabel(tx.type)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{tx.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString('es-VE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === 'recharge' || tx.type === 'refund' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {tx.type === 'recharge' || tx.type === 'refund' ? '+' : '-'}
                        {formatCurrency(tx.amount_ves, 'VES')}
                      </p>
                      {tx.amount_usd > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(tx.amount_usd, 'USD')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalTransactions > transactionsPerPage && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {((currentPage - 1) * transactionsPerPage) + 1} - {Math.min(currentPage * transactionsPerPage, totalTransactions)} de {totalTransactions}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage * transactionsPerPage >= totalTransactions}
                    className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      {/* Status Badge */}
      {wallet?.status !== 'active' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <p className="text-sm text-yellow-800">
            <strong>Atención:</strong> Tu billetera está {wallet?.status}. Contacta a soporte si necesitas ayuda.
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletDashboard;
