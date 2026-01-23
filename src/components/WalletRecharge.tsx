import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle, AlertCircle, Loader2, Copy, Hash, Building2, DollarSign, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';

interface WalletRechargeProps {
  userId: string;
  userPhone: string;
  prefilledAmount?: number;
  onSuccess: (newBalance: { ves: number; usd: number }) => void;
  onCancel?: () => void;
  walletStatus?: string; // Add wallet status prop
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
  onCancel,
  walletStatus = 'active'
}) => {
  const [step, setStep] = useState<'amount' | 'confirm' | 'payment' | 'verification' | 'success' | 'error'>('amount');
  const [amount, setAmount] = useState(prefilledAmount ? prefilledAmount.toFixed(2) : '');
  const [originBank, setOriginBank] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<{ ves: number; usd: number } | null>(null);

  const [isDomainAllowed, setIsDomainAllowed] = useState(true);

  // Datos de pago de MI PANA APP
  const paymentData = {
    bank: 'Bancamiga',
    bankCode: '0172',
    phone: '0414-5274111',
    rif: 'J-40724274-1',
    holder: 'NEXT TV, C.A.',
  };

  useEffect(() => {
    const hostname = window.location.hostname;
    // Allow localhost for dev, but enforce v1.mipana.app for production
    const isAllowed = hostname.includes('localhost') || hostname === 'v1.mipana.app';
    setIsDomainAllowed(isAllowed);

    if (!isAllowed) {
      setError('Por seguridad bancaria, esta función solo está disponible en v1.mipana.app');
      setStep('error');
    }

    // Check wallet status
    if (walletStatus !== 'active') {
      setError(`Tu billetera está ${walletStatus}. Contacta a soporte para activarla.`);
      setStep('error');
    }
  }, [walletStatus]);

  useEffect(() => {
    if (prefilledAmount) {
      setStep('confirm');
    }
  }, [prefilledAmount]);

  // Real-time amount validation
  useEffect(() => {
    if (amount) {
      const num = parseFloat(amount);
      if (isNaN(num)) {
        setAmountError('Formato inválido');
      } else if (num < 1) {
        setAmountError('Mínimo Bs. 1.00');
      } else if (num > 100000) {
        setAmountError('Máximo Bs. 100,000.00');
      } else {
        setAmountError(null);
      }
    } else {
      setAmountError(null);
    }
  }, [amount]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d.,]/g, '');

    // Replace comma with period
    value = value.replace(',', '.');

    // Limit to 2 decimals
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts[1];
    }
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }

    setAmount(value);
  };

  const formatAmountDisplay = (amt: string): string => {
    const num = parseFloat(amt);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 4);
    setLastFourDigits(cleaned);
  };

  const handleContinueToConfirm = () => {
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      setError('Por favor ingresa un monto válido');
      return;
    }

    if (numAmount < 1) {
      setError('El monto mínimo de recarga es Bs. 1.00');
      return;
    }

    if (numAmount > 100000) {
      setError('El monto máximo de recarga es Bs. 100,000.00');
      return;
    }

    setError(null);
    setStep('confirm');
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
        const errorMsg = result.error || 'No se pudo verificar el pago.';
        const suggestions = [
          'Verifica que los últimos 4 dígitos sean correctos',
          'Confirma que seleccionaste el banco correcto',
          'Asegúrate de que el pago se realizó en las últimas 24 horas',
          `Verifica que el monto sea exactamente Bs. ${amount}`
        ];
        setError(`${errorMsg}\n\nSugerencias:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monto a Recargar</label>
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

              {/* Real-time validation feedback */}
              {amountError && (
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {amountError}
                </p>
              )}

              {/* Amount preview */}
              {amount && !amountError && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-3 rounded-r-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Vista previa:</strong> Bs. {formatAmountDisplay(amount)}
                  </p>
                </div>
              )}
            </div>

            {/* Exact amount warning */}
            {amount && !amountError && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex gap-3">
                  <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-bold mb-1">⚠️ Importante</p>
                    <p>Debes pagar <strong>exactamente Bs. {formatAmountDisplay(amount)}</strong> (incluye los céntimos)</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-xs font-bold flex items-center gap-1 animate-pulse">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              onClick={handleContinueToConfirm}
              disabled={!amount || parseFloat(amount) <= 0 || !!amountError}
              className="w-full bg-mipana-orange hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 group"
            >
              Siguiente <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Confirma tu Recarga</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vas a recargar:</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-8 text-center">
              <p className="text-sm text-green-700 dark:text-green-400 mb-2 font-medium">Monto Exacto</p>
              <p className="text-6xl font-black text-green-900 dark:text-green-100 mb-1">
                Bs. {formatAmountDisplay(amount)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">Incluye céntimos</p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 p-4 rounded-r-lg">
              <div className="flex gap-3">
                <AlertCircle className="text-orange-600 dark:text-orange-400 flex-shrink-0" size={20} />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <p className="font-bold mb-2">⚠️ Importante</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Debes pagar <strong>exactamente Bs. {formatAmountDisplay(amount)}</strong></li>
                    <li>Incluye los céntimos (.{formatAmountDisplay(amount).split('.')[1]})</li>
                    <li>Cualquier diferencia causará rechazo</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('amount')}
                className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold transition-all active:scale-95"
              >
                Cambiar Monto
              </button>
              <button
                onClick={() => setStep('payment')}
                className="flex-1 bg-mipana-orange hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                Continuar <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
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
            <h3 className="text-xl font-black text-red-600">
              {!isDomainAllowed
                ? "Acceso Restringido"
                : error?.toLowerCase().includes('interno') || error?.toLowerCase().includes('banco')
                  ? "Error del Servicio"
                  : "Error de Verificación"}
            </h3>
            <p className="text-xs text-gray-500 font-bold leading-relaxed px-2">
              {!isDomainAllowed
                ? "Por motivos de seguridad bancaria (Whitelist), los pagos solo pueden procesarse desde el dominio autorizado."
                : error}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              {!isDomainAllowed ? (
                <a
                  href="https://v1.mipana.app/wallet"
                  className="w-full bg-mipana-orange text-white py-3.5 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Ir a v1.mipana.app <ArrowRight size={18} />
                </a>
              ) : (
                <>
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
                </>
              )}
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
