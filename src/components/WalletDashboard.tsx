import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, TrendingUp, Plus, ArrowUpRight, ArrowDownRight, RefreshCw, History } from 'lucide-react';

interface WalletDashboardProps {
  userId: string;
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

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ userId, onRecharge }) => {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    fetchWalletBalance();
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
      <div className="flex items-center justify-center p-8">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
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
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Actualizar saldo"
        >
          <RefreshCw size={20} className="text-gray-600" />
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
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">Historial de Transacciones</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <History size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay transacciones aún</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(tx.type)}
                      <div>
                        <p className="font-medium text-gray-900">{getTransactionLabel(tx.type)}</p>
                        <p className="text-sm text-gray-500">{tx.description}</p>
                        <p className="text-xs text-gray-400">
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
                      <p className={`font-bold ${tx.type === 'recharge' || tx.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'recharge' || tx.type === 'refund' ? '+' : '-'}
                        {formatCurrency(tx.amount_ves, 'VES')}
                      </p>
                      {tx.amount_usd > 0 && (
                        <p className="text-sm text-gray-500">
                          {formatCurrency(tx.amount_usd, 'USD')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
