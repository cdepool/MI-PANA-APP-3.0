import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle, AlertCircle, Loader2, Copy, Hash, Building2, DollarSign, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';

interface WalletRechargeProps {
  userId: string;
  userPhone: string;
  prefilledAmount?: number;
  onSuccess: (newBalance: { ves: number; usd: number }) => void;
  onCancel?: () => void;
}

// Lista de bancos principales de Venezuela
const venezuelanBanks = [
  { code: '0102', name: 'Banco de Venezuela' },
  { code: '0105', name: 'Mercantil' },
  { code: '0108', name: 'BBVA Provincial' },
  { code: '0114', name: 'Bancaribe' },
  { code: '0134', name: 'Banesco' },
  { code: '0151', name: 'BFC Banco Fondo Común' },
  { code: '0163', name: 'Banco del Tesoro' },
  { code: '0172', name: 'Bancamiga' },
  { code: '0174', name: 'Banplus' },
  { code: '0175', name: 'Bicentenario' },
  { code: '0191', name: 'BNC' },
];

export const WalletRecharge: React.FC<WalletRechargeProps> = ({
  userId,
  userPhone,
  prefilledAmount,
  onSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<'amount' | 'payment' | 'verification' | 'success' | 'error'>('amount');
  const [amount, setAmount] = useState(prefilledAmount ? prefilledAmount.toString() : '');
  const [originBank, setOriginBank] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<{ ves: number; usd: number } | null>(null);

  // Datos de pago de MI PANA APP
  const paymentData = {
    bank: 'Bancamiga',
    bankCode: '0172',
    phone: '0414-5274111',
    rif: 'J-40724274-1',
    holder: 'NEXT TV, C.A.',
  };

  useEffect(() => {
    if (prefilledAmount) {
      setStep('payment');
    }
  }, [prefilledAmount]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    setAmount(value);
  };

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 4);
    setLastFourDigits(cleaned);
  };

  const handleContinueToPayment = () => {
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      setError('Por favor ingresa un monto válido');
      return;
    }

    if (numAmount < 1) {
      setError('El monto mínimo de recarga es Bs. 1.00');
      return;
    }

    setError(null);
    setStep('payment');
  };

  const handleProcessRecharge = async () => {
    if (!originBank) {
      setError('Selecciona el banco de origen');
      return;
    }

    if (lastFourDigits.length !== 4) {
      setError('Ingresa los 4 dígitos finales');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-recharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          userId: userId,
          userPhone: userPhone,
          amount: parseFloat(amount),
          bancoOrig: originBank,
          lastFourDigits: lastFourDigits
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const mappedWallet = {
          ves: result.wallet.balance_ves,
          usd: result.wallet.balance_usd
        };
        setNewBalance(mappedWallet);
        setStep('success');
        setTimeout(() => {
          onSuccess(mappedWallet);
        }, 2000);
      } else {
        setError(result.error || 'No se pudo verificar el pago. Si ya pagaste, espera unos minutos e intenta de nuevo.');
        setStep('error');
      }
    } catch (err) {
      console.error('Error processing recharge:', err);
      setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setStep('payment');
    setError(null);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(value);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-br from-mipana-darkBlue to-mipana-mediumBlue p-6 text-white relative h-32 flex flex-col justify-end">
        <div className="absolute top-4 right-4 group">
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
            <Wallet size={28} className="text-mipana-orange" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Recargar Saldo</h2>
            <p className="text-xs text-white/70 font-medium">Pago Móvil Bancamiga</p>
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-mipana-orange/20 rounded-full blur-[40px] -mr-10 -mt-10"></div>
      </div>

      {/* Progress Bar */}
      <div className="flex w-full h-1 bg-gray-100 dark:bg-800">
        <div
          className="h-full bg-mipana-orange transition-all duration-500"
          style={{ width: step === 'amount' ? '25%' : step === 'payment' ? '50%' : step === 'verification' ? '75%' : '100%' }}
        ></div>
      </div>

      {/* Content */}
      <div className="p-6">
        {step === 'amount' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-mipana-mediumBlue/10 p-4 rounded-2xl flex items-start gap-3 border border-mipana-mediumBlue/10">
              <DollarSign className="text-mipana-mediumBlue mt-0.5" size={18} />
              <p className="text-sm text-mipana-darkBlue dark:text-gray-300 font-medium leading-tight">
                Ingresa el monto en Bolívares que deseas añadir a tu billetera.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-400">Bs.</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full pl-16 pr-4 py-6 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-mipana-orange dark:focus:border-mipana-orange outline-none rounded-2xl text-4xl font-black text-mipana-darkBlue dark:text-white transition-all shadow-inner"
              />
            </div>

            {error && (
              <div className="text-red-500 text-xs font-bold flex items-center gap-1 animate-pulse">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              onClick={handleContinueToPayment}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full bg-mipana-orange hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 group"
            >
              Siguiente <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monto a Pagar</p>
              <h3 className="text-4xl font-black text-mipana-darkBlue dark:text-white">{formatCurrency(parseFloat(amount))}</h3>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
              {[
                { label: 'Banco', value: paymentData.bank, code: paymentData.bankCode },
                { label: 'Teléfono', value: paymentData.phone, copy: paymentData.phone.replace(/-/g, '') },
                { label: 'RIF', value: paymentData.rif, copy: paymentData.rif.replace(/-/g, '') },
                { label: 'Titular', value: paymentData.holder }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between pb-2 last:pb-0 last:border-0 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{item.label}</p>
                    <p className="text-sm font-bold text-mipana-darkBlue dark:text-white">
                      {item.value} {item.code && <span className="text-[10px] text-gray-400">({item.code})</span>}
                    </p>
                  </div>
                  {item.copy && (
                    <button
                      onClick={() => handleCopy(item.copy!, item.label)}
                      className="p-2 hover:bg-mipana-mediumBlue/10 rounded-xl transition-colors text-mipana-mediumBlue active:scale-90"
                    >
                      {copiedField === item.label ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="relative">
                  <select
                    value={originBank}
                    onChange={(e) => setOriginBank(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 focus:border-mipana-mediumBlue outline-none rounded-xl text-sm font-bold transition-all appearance-none"
                  >
                    <option value="">Banco desde el que pagaste</option>
                    {venezuelanBanks.map((bank) => (
                      <option key={bank.code} value={bank.code}>{bank.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Building2 size={16} className="text-gray-400" />
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={lastFourDigits}
                    onChange={handleDigitsChange}
                    placeholder="Últimos 4 dígitos de Referencia"
                    maxLength={4}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 focus:border-mipana-mediumBlue outline-none rounded-xl text-sm font-bold transition-all text-center tracking-[0.5em]"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Hash size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('amount')}
                  className="flex-shrink-0 px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Atrás
                </button>
                <button
                  onClick={handleProcessRecharge}
                  disabled={!originBank || lastFourDigits.length !== 4 || isProcessing}
                  className="flex-1 bg-mipana-darkBlue hover:bg-[#001530] active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  {isProcessing ? <Loader2 size={24} className="animate-spin" /> : 'Verificar Pago'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-50 duration-500">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle size={48} className="text-green-500 animate-bounce-in" />
            </div>
            <h3 className="text-2xl font-black text-mipana-darkBlue dark:text-white">¡Listo, Mi Pana!</h3>
            <p className="text-sm text-gray-500 font-medium px-4">
              Hemos acreditado <b>{formatCurrency(parseFloat(amount))}</b> a tu billetera exitosamente.
            </p>
            {newBalance && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl inline-block border border-gray-100 dark:border-gray-700 shadow-inner">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Nuevo Saldo Disponible</p>
                <p className="text-2xl font-black text-mipana-darkBlue dark:text-white">
                  ${newBalance.usd.toFixed(2)} <span className="text-xs text-gray-400 font-bold ml-1">USD</span>
                </p>
              </div>
            )}
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-6 space-y-4 animate-in shake duration-500">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-red-600">Algo salió mal</h3>
            <p className="text-xs text-gray-500 font-bold leading-relaxed px-2">{error}</p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleRetry}
                className="w-full bg-mipana-darkBlue text-white py-3.5 rounded-2xl font-bold active:scale-95 transition-all"
              >
                Intentar con otra referencia
              </button>
              <button
                onClick={() => setStep('amount')}
                className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cambiar monto
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-700 text-center">
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Tecnología Bancamiga Verificada by SITCA</p>
      </div>
    </div>
  );
};

export default WalletRecharge;
