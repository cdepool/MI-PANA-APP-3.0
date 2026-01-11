import React, { useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle, Loader, Copy, Hash, Building2 } from 'lucide-react';

interface BancamigaPaymentFlowProps {
  amount: number; // Monto en VES (Bolívares)
  userId: string; // ID del usuario logueado
  userPhone: string; // Teléfono del usuario logueado
  onPaymentConfirmed: (refpk: string) => void;
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

export const BancamigaPaymentFlow: React.FC<BancamigaPaymentFlowProps> = ({
  amount,
  userId,
  userPhone,
  onPaymentConfirmed,
  onCancel
}) => {
  const [step, setStep] = useState<'instructions' | 'verification' | 'success' | 'error'>('instructions');
  const [originBank, setOriginBank] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDomainAllowed, setIsDomainAllowed] = useState(true);

  // Datos de pago de MI PANA APP
  const paymentData = {
    bank: 'Bancamiga',
    bankCode: '0172',
    phone: '0414-5274111',
    rif: 'J-40724274-1',
    holder: 'NEXT TV, C.A.',
    amount: amount.toFixed(2)
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
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 4);
    setLastFourDigits(cleaned);
  };

  const handleVerifyPayment = async () => {
    if (!originBank) {
      setError('Por favor selecciona el banco desde el cual realizaste el pago');
      return;
    }

    if (lastFourDigits.length !== 4) {
      setError('Por favor ingresa los últimos 4 dígitos de la referencia');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bancamiga-verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          userId: userId,
          userPhone: userPhone,
          bancoOrig: originBank,
          lastFourDigits: lastFourDigits,
          expectedAmount: amount
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStep('success');
        setTimeout(() => {
          onPaymentConfirmed(result.refpk);
        }, 2000);
      } else {
        setError(result.error || 'No se encontró el pago. Verifica los datos e intenta nuevamente.');
        setStep('error');
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError('Error al verificar el pago. Por favor intenta nuevamente.');
      setStep('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetry = () => {
    setStep('instructions');
    setError(null);
    setOriginBank('');
    setLastFourDigits('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard size={32} />
            <div>
              <h2 className="text-xl font-bold">Pago Móvil</h2>
              <p className="text-sm opacity-90">Verificación Automática</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Monto a pagar</p>
            <p className="text-2xl font-bold">Bs. {paymentData.amount}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {step === 'instructions' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
              <p className="text-sm text-blue-900 font-medium">
                📱 <strong>Paso 1:</strong> Realiza el pago móvil desde tu banco con los siguientes datos:
              </p>
            </div>

            {/* Payment Details */}
            <div className="space-y-3">
              {/* Bank */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Banco Destino</p>
                  <p className="text-base font-bold text-gray-900">{paymentData.bank} ({paymentData.bankCode})</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                  <p className="text-base font-bold text-gray-900">{paymentData.phone}</p>
                </div>
                <button
                  onClick={() => handleCopy(paymentData.phone.replace(/-/g, ''), 'phone')}
                  className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copiar teléfono"
                >
                  {copiedField === 'phone' ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <Copy size={20} className="text-gray-600" />
                  )}
                </button>
              </div>

              {/* RIF */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">RIF</p>
                  <p className="text-base font-bold text-gray-900">{paymentData.rif}</p>
                </div>
                <button
                  onClick={() => handleCopy(paymentData.rif.replace(/-/g, ''), 'rif')}
                  className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copiar RIF"
                >
                  {copiedField === 'rif' ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <Copy size={20} className="text-gray-600" />
                  )}
                </button>
              </div>

              {/* Holder */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Titular</p>
                  <p className="text-base font-bold text-gray-900">{paymentData.holder}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between p-3 bg-green-50 border-2 border-green-600 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-green-700 font-medium">Monto Exacto</p>
                  <p className="text-xl font-bold text-green-900">Bs. {paymentData.amount}</p>
                </div>
                <button
                  onClick={() => handleCopy(paymentData.amount, 'amount')}
                  className="ml-2 p-2 hover:bg-green-100 rounded-lg transition-colors"
                  title="Copiar monto"
                >
                  {copiedField === 'amount' ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <Copy size={20} className="text-green-700" />
                  )}
                </button>
              </div>
            </div>

            {/* Verification Form */}
            <div className="border-t pt-6 space-y-4">
              <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r-lg">
                <p className="text-sm text-green-900 font-medium">
                  ✅ <strong>Paso 2:</strong> Una vez realizado el pago, ingresa estos datos:
                </p>
              </div>

              {/* Bank Origin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 size={16} className="inline mr-1" />
                  Banco desde el cual pagaste
                </label>
                <select
                  value={originBank}
                  onChange={(e) => setOriginBank(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-base"
                >
                  <option value="">Selecciona tu banco</option>
                  {venezuelanBanks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Last 4 Digits */}
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-2xl font-mono text-center tracking-widest"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {lastFourDigits.length}/4 dígitos
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleVerifyPayment}
                disabled={!originBank || lastFourDigits.length !== 4 || isVerifying}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Pago'
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8 space-y-4">
            <CheckCircle size={64} className="text-green-600 mx-auto animate-bounce" />
            <h3 className="text-2xl font-bold text-gray-900">¡Pago Confirmado!</h3>
            <p className="text-gray-600">
              Tu pago ha sido verificado exitosamente. Procesando tu viaje...
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-8 space-y-4">
            <AlertCircle size={64} className="text-red-600 mx-auto" />
            <h3 className="text-2xl font-bold text-gray-900">
              {!isDomainAllowed ? "Acceso Restringido" : "Error de Verificación"}
            </h3>
            <p className="text-gray-600 px-4">
              {!isDomainAllowed
                ? "Por motivos de seguridad bancaria (Whitelist), los pagos solo pueden procesarse desde el dominio autorizado v1.mipana.app."
                : error}
            </p>

            {!isDomainAllowed ? (
              <a
                href="https://v1.mipana.app/wallet"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors text-center"
              >
                Ir a v1.mipana.app
              </a>
            ) : (
              <>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left">
                  <p className="text-sm text-yellow-800">
                    <strong>Verifica que:</strong>
                  </p>
                  <ul className="text-xs text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Los últimos 4 dígitos sean correctos</li>
                    <li>Hayas seleccionado el banco correcto</li>
                    <li>El pago se haya realizado en las últimas 24 horas</li>
                    <li>El monto sea exactamente Bs. {paymentData.amount}</li>
                  </ul>
                </div>
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Intentar Nuevamente
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BancamigaPaymentFlow;
