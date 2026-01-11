import React, { useState } from 'react';
import { Wallet, CheckCircle, AlertCircle, Loader, Copy, Hash, Building2, DollarSign } from 'lucide-react';

interface WalletRechargeProps {
  userId: string;
  userPhone: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

// Lista de bancos principales de Venezuela
const venezuelanBanks = [
  { code: '0102', name: 'Banco de Venezuela' },
  { code: '0104', name: 'Venezolano de Crédito' },
  { code: '0105', name: 'Mercantil' },
  { code: '0108', name: 'BBVA Provincial' },
  { code: '0114', name: 'Bancaribe' },
  { code: '0115', name: 'Exterior' },
  { code: '0134', name: 'Banesco' },
  { code: '0151', name: 'BFC Banco Fondo Común' },
  { code: '0156', name: '100% Banco' },
  { code: '0163', name: 'Banco del Tesoro' },
  { code: '0166', name: 'Banco Agrícola' },
  { code: '0171', name: 'Banco Activo' },
  { code: '0172', name: 'Bancamiga' },
  { code: '0174', name: 'Banplus' },
  { code: '0175', name: 'Bicentenario' },
  { code: '0177', name: 'Banfanb' },
];

export const WalletRecharge: React.FC<WalletRechargeProps> = ({
  userId,
  userPhone,
  onSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<'amount' | 'payment' | 'verification' | 'success' | 'error'>('amount');
  const [amount, setAmount] = useState('');
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

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
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
      setError('Por favor selecciona el banco desde el cual realizaste el pago');
      return;
    }

    if (lastFourDigits.length !== 4) {
      setError('Por favor ingresa los últimos 4 dígitos de la referencia');
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
        setNewBalance(result.wallet);
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        setError(result.error || 'No se pudo procesar la recarga. Intenta nuevamente.');
        setStep('error');
      }
    } catch (err) {
      console.error('Error processing recharge:', err);
      setError('Error al procesar la recarga. Por favor intenta nuevamente.');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setStep('payment');
    setError(null);
    setOriginBank('');
    setLastFourDigits('');
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 p-6 text-white">
        <div className="flex items-center gap-3">
          <Wallet size={32} />
          <div>
            <h2 className="text-xl font-bold">Recargar Billetera</h2>
            <p className="text-sm opacity-90">Agrega fondos vía Pago Móvil</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Step 1: Amount */}
        {step === 'amount' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
              <p className="text-sm text-blue-900 font-medium">
                💰 Ingresa el monto que deseas recargar a tu billetera
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign size={16} className="inline mr-1" />
                Monto a Recargar (Bolívares)
              </label>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-3xl font-bold text-center"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Monto mínimo: Bs. 1.00
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg">
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleContinueToPayment}
                disabled={!amount || parseFloat(amount) <= 0}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Instructions */}
        {step === 'payment' && (
          <div className="space-y-6">
            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r-lg">
              <p className="text-sm text-green-900 font-medium mb-2">
                📱 <strong>Paso 1:</strong> Realiza el pago móvil con estos datos:
              </p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {formatCurrency(parseFloat(amount))}
              </p>
            </div>

            {/* Payment Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Banco Destino</p>
                  <p className="text-base font-bold text-gray-900">{paymentData.bank} ({paymentData.bankCode})</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                  <p className="text-base font-bold text-gray-900">{paymentData.phone}</p>
                </div>
                <button
                  onClick={() => handleCopy(paymentData.phone.replace(/-/g, ''), 'phone')}
                  className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copiedField === 'phone' ? <CheckCircle size={20} className="text-green-600" /> : <Copy size={20} className="text-gray-600" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">RIF</p>
                  <p className="text-base font-bold text-gray-900">{paymentData.rif}</p>
                </div>
                <button
                  onClick={() => handleCopy(paymentData.rif.replace(/-/g, ''), 'rif')}
                  className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copiedField === 'rif' ? <CheckCircle size={20} className="text-green-600" /> : <Copy size={20} className="text-gray-600" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Titular</p>
                  <p className="text-base font-bold text-gray-900">{paymentData.holder}</p>
                </div>
              </div>
            </div>

            {/* Verification Form */}
            <div className="border-t pt-6 space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                <p className="text-sm text-blue-900 font-medium">
                  ✅ <strong>Paso 2:</strong> Ingresa estos datos después de realizar el pago:
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 size={16} className="inline mr-1" />
                  Banco desde el cual pagaste
                </label>
                <select
                  value={originBank}
                  onChange={(e) => setOriginBank(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-base"
                >
                  <option value="">Selecciona tu banco</option>
                  {venezuelanBanks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash size={16} className="inline mr-1" />
                  Últimos 4 dígitos de la referencia
                </label>
                <input
                  type="text"
                  value={lastFourDigits}
                  onChange={handleDigitsChange}
                  placeholder="1234"
                  maxLength={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-2xl font-mono text-center tracking-widest"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {lastFourDigits.length}/4 dígitos
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('amount')}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={handleProcessRecharge}
                disabled={!originBank || lastFourDigits.length !== 4 || isProcessing}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar y Recargar'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center py-8 space-y-4">
            <CheckCircle size={64} className="text-green-600 mx-auto animate-bounce" />
            <h3 className="text-2xl font-bold text-gray-900">¡Recarga Exitosa!</h3>
            <p className="text-gray-600">
              Se han agregado {formatCurrency(parseFloat(amount))} a tu billetera
            </p>
            {newBalance && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-green-700 mb-2">Nuevo saldo:</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(newBalance.ves)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Error */}
        {step === 'error' && (
          <div className="text-center py-8 space-y-4">
            <AlertCircle size={64} className="text-red-600 mx-auto" />
            <h3 className="text-2xl font-bold text-gray-900">Error en la Recarga</h3>
            <p className="text-gray-600 px-4">{error}</p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left">
              <p className="text-sm text-yellow-800">
                <strong>Verifica que:</strong>
              </p>
              <ul className="text-xs text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                <li>Los últimos 4 dígitos sean correctos</li>
                <li>Hayas seleccionado el banco correcto</li>
                <li>El pago se haya realizado en las últimas 72 horas</li>
                <li>El monto sea exactamente {formatCurrency(parseFloat(amount))}</li>
              </ul>
            </div>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
            >
              Intentar Nuevamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletRecharge;
