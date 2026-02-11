import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { walletService } from '../services/walletService';
import { Loader2, Smartphone, ArrowRight, ChevronDown, Copy, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface WalletRechargeProps {
  onBack: () => void;
  onSuccess: () => void;
}

// Bancos soportados
const BANKS = [
  "Bancamiga",
  "Banco de Venezuela",
  "Banesco",
  "BBVA Provincial",
  "Mercantil",
  "BNC",
  "Bicentenaria",
  "Tesoro",
  "Banplus",
  "Plaza",
  "Caroni",
  "Dyceven",
  "100% Banco",
  "Del Sur",
  "Exterior",
  "Venezolano de Crédito",
  "Bancaribe",
  "Mi Banco",
  "Bangente",
  "Bancrecer"
].sort();

export default function WalletRecharge({ onBack, onSuccess }: WalletRechargeProps) {
  const { user } = useAuth();

  // Estados del Wizard
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Método, 2: Monto, 3: Validación

  // Datos Financieros (Fetch local para evitar problemas con User Context incompleto)
  const [balanceUSD, setBalanceUSD] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(64.00); // Valor inicial seguro
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Datos del Formulario
  const [amountUSD, setAmountUSD] = useState<string>('');
  const [amountBS, setAmountBS] = useState<string>('');
  const [reference, setReference] = useState('');
  const [originBank, setOriginBank] = useState('');
  const [originPhone, setOriginPhone] = useState(''); // Se inicializa luego con useEffect
  const [showOriginPhoneInput, setShowOriginPhoneInput] = useState(false);

  // Estados de UI
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar saldo y tasa al montar
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      if (!user?.id) return;
      try {
        const data = await walletService.getBalance(user.id);
        if (mounted && data) {
          setBalanceUSD(data.wallet.balance_usd);
          setExchangeRate(data.exchange_rate);
        }
      } catch (err) {
        console.error('Error cargando saldo:', err);
      } finally {
        if (mounted) setIsLoadingBalance(false);
      }
    };

    // Inicializar teléfono con el del usuario
    if (user?.phone) {
      setOriginPhone(user.phone);
    }

    loadData();
    return () => { mounted = false; };
  }, [user]);

  // Sincronizar montos
  const handleUSDChange = (val: string) => {
    setAmountUSD(val);
    if (!val) {
      setAmountBS('');
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAmountBS((num * exchangeRate).toFixed(2));
    }
  };

  const handleBSChange = (val: string) => {
    setAmountBS(val);
    if (!val) {
      setAmountUSD('');
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAmountUSD((num / exchangeRate).toFixed(2));
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const validatePayment = async () => {
    setError(null);

    // Validaciones Locales
    if (!reference || reference.length !== 4) {
      toast.error('La referencia debe ser los últimos 4 dígitos');
      return;
    }
    if (!originBank) {
      toast.error('Selecciona el banco de origen');
      return;
    }

    // Validar teléfono telefonico
    const phoneToSend = showOriginPhoneInput ? originPhone : (user?.phone || '');
    if (!phoneToSend) {
      if (!showOriginPhoneInput) {
        setShowOriginPhoneInput(true);
        toast.error('Por favor verifica el teléfono de origen');
        return;
      }
      toast.error('El teléfono es requerido');
      return;
    }

    setIsValidating(true);

    try {
      if (!user?.id) throw new Error('Usuario no identificado');

      const amountNum = parseFloat(amountBS);
      if (isNaN(amountNum) || amountNum < 1) {
        throw new Error('El monto mínimo es 1 Bs');
      }

      const result = await walletService.rechargeWallet(
        user.id,
        user.phone || '',
        amountNum,
        originBank,
        reference,
        phoneToSend
      );

      if (result.success) {
        toast.success('¡Recarga exitosa!');
        onSuccess();
      } else {
        setError(result.error || 'No se pudo verificar el pago. Verifica los datos.');
      }

    } catch (err: any) {
      console.error('Error en recarga:', err);
      setError(err.message || 'Error de conexión');
    } finally {
      setIsValidating(false);
    }
  };

  // HEADER COMPONENT
  const Header = ({ title, showBack = true }: { title: string, showBack?: boolean }) => (
    <div className="flex items-center gap-4 mb-6">
      {showBack && (
        <button
          onClick={() => step === 1 ? onBack() : setStep(prev => (prev - 1) as any)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          {/* Usamos ArrowLeft para atrás, es más estándar que Chevron rotado */}
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
      )}
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );

  // --- RENDERS POR PASO ---

  // 1. SELECCIÓN DE MÉTODO
  if (step === 1) {
    return (
      <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Header title="Recargar billetera" />

        {/* Tarjeta de Saldo */}
        <div className="relative overflow-hidden mb-6 shadow-xl rounded-3xl">
          <div className="bg-black text-white p-6 rounded-3xl relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1 font-medium">Saldo disponible</p>
                {isLoadingBalance ? (
                  <div className="h-10 w-32 bg-gray-800 rounded animate-pulse" />
                ) : (
                  <h3 className="text-4xl font-black tracking-tight">
                    $ {balanceUSD.toFixed(2)}
                  </h3>
                )}
              </div>
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl shadow-lg text-black font-bold">
                $
              </div>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              Tasa: {exchangeRate.toFixed(2)} Bs/$
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-4 text-gray-800">Métodos disponibles</h3>

        <button
          onClick={() => setStep(2)}
          className="w-full bg-white border border-gray-100 shadow-lg shadow-gray-200/50 p-4 rounded-2xl flex items-center gap-4 hover:shadow-xl hover:scale-[1.02] transition-all group duration-300"
        >
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-gray-100 transition-colors">
            📱
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-bold text-gray-900 text-lg">Pago Móvil</h4>
            <p className="text-sm text-gray-500 font-medium">Acreditación inmediata (Automático)</p>
          </div>
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shadow-sm">
            {/* Usamos CheckCircle normal */}
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        </button>
      </div>
    );
  }

  // 2. DEFINICIÓN DE MONTO
  if (step === 2) {
    return (
      <div className="p-4 h-full flex flex-col animate-in slide-in-from-right duration-300">
        <Header title="Pago Móvil 📱" />

        <div className="bg-lime-100 border border-lime-200 p-4 rounded-2xl mb-6 flex flex-col items-center justify-center">
          <span className="text-lime-700 text-xs font-bold uppercase tracking-wider mb-1">Monto a Pagar</span>
          <span className="font-black text-3xl text-lime-900 tracking-tight">
            {amountBS ? `${amountBS} Bs` : '0,00 Bs'}
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-50 p-6 mb-6 flex-1">
          <h3 className="text-center font-bold text-gray-800 mb-8 px-2 leading-snug">
            ¿Cuánto quieres recargar?
          </h3>

          <div className="space-y-6">
            <div className="relative group">
              <label className="text-xs font-bold text-gray-400 absolute -top-2 left-4 bg-white px-2">USD</label>
              <input
                type="number"
                value={amountUSD}
                onChange={(e) => handleUSDChange(e.target.value)}
                placeholder="0.00"
                className="w-full text-center text-3xl font-black p-4 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-gray-100 focus:border-black outline-none transition-all placeholder:text-gray-200"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl">$</span>
            </div>

            <div className="relative group grayscale opacity-90 focus-within:grayscale-0 focus-within:opacity-100 transition-all">
              <label className="text-xs font-bold text-gray-400 absolute -top-2 left-4 bg-white px-2 z-10">BOLÍVARES</label>
              <input
                type="number"
                value={amountBS}
                onChange={(e) => handleBSChange(e.target.value)}
                placeholder="0.00"
                className="w-full text-center text-3xl font-black p-4 border-2 border-gray-100 bg-gray-50 rounded-2xl focus:ring-4 focus:ring-gray-100 focus:border-black outline-none transition-all placeholder:text-gray-300"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl">Bs</span>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => {
                if (!amountBS || parseFloat(amountBS) <= 0) {
                  toast.error('Ingrese un monto válido');
                  return;
                }
                setStep(3);
              }}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/20"
            >
              Continuar
            </button>
          </div>
        </div>

        {/* Info de Pago Minimized */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Tasa de cambio</span>
            <span className="font-bold text-gray-900">{exchangeRate.toFixed(2)} Bs/$</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. VALIDACIÓN
  if (step === 3) {
    return (
      <div className="p-4 h-full flex flex-col animate-in slide-in-from-right duration-300">
        <Header title="Validar Pago" />

        <div className="bg-lime-400 p-6 rounded-[2rem] mb-6 flex flex-col items-center justify-center shadow-lg shadow-lime-200">
          <span className="text-lime-900/60 font-bold text-xs uppercase tracking-widest mb-1">Total a Transferir</span>
          <span className="font-black text-4xl text-black tracking-tighter">
            {amountBS} Bs
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 mb-6 shadow-xl shadow-gray-100 border border-gray-50">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Referencia (Últimos 4)</label>
              <input
                type="text"
                maxLength={4}
                value={reference}
                onChange={(e) => setReference(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="w-full text-center text-2xl font-mono p-3 rounded-xl border-2 border-gray-100 focus:border-black focus:ring-4 focus:ring-gray-50 outline-none transition-all tracking-widest placeholder:text-gray-200"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Banco de Origen</label>
              <div className="relative">
                <select
                  value={originBank}
                  onChange={(e) => setOriginBank(e.target.value)}
                  className="w-full text-lg font-medium p-4 rounded-xl border-2 border-gray-100 focus:border-black outline-none bg-white text-gray-800 appearance-none pl-4 pr-10"
                >
                  <option value="">Selecciona tu banco...</option>
                  {BANKS.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
              </div>
            </div>

            {/* Toggle Inteligente */}
            <div className="pt-2">
              {!showOriginPhoneInput ? (
                <button
                  onClick={() => {
                    setShowOriginPhoneInput(true);
                    if (!originPhone && user?.phone) setOriginPhone(user.phone);
                  }}
                  className="w-full py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  ¿Pagaste desde otro número?
                </button>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl animate-in fade-in zoom-in duration-200">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Teléfono de Origen</label>
                  <input
                    type="tel"
                    value={originPhone}
                    onChange={(e) => setOriginPhone(e.target.value)}
                    placeholder="0414..."
                    className="w-full text-lg p-3 rounded-xl border border-gray-200 focus:border-black outline-none bg-white mb-2"
                  />
                  <button
                    onClick={() => {
                      setShowOriginPhoneInput(false);
                      if (user?.phone) setOriginPhone(user.phone);
                    }}
                    className="text-red-500 text-xs font-bold hover:underline w-full text-right"
                  >
                    Cancelar (Usar mi número)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Datos de Pago */}
        <div className="mb-6 bg-gray-900 rounded-2xl p-5 text-gray-300">
          <h4 className="font-bold text-white text-xs uppercase mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Datos para el Pago Móvil
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center group">
              <span className="">Teléfono</span>
              <div className="flex items-center gap-2 font-mono text-white bg-white/10 px-2 py-1 rounded cursor-pointer hover:bg-white/20 transition-colors" onClick={() => handleCopy('04145274111', 'Teléfono')}>
                0414-527-4111 <Copy className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div className="flex justify-between items-center group">
              <span className="">RIF</span>
              <div className="flex items-center gap-2 font-mono text-white bg-white/10 px-2 py-1 rounded cursor-pointer hover:bg-white/20 transition-colors" onClick={() => handleCopy('J407242741', 'RIF')}>
                J-407242741 <Copy className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="">Banco</span>
              <span className="font-bold text-white">Bancamiga (0172)</span>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-4 flex items-start gap-3 animate-in shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={validatePayment}
            disabled={isValidating}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Validar Pago
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </div>
    );
  }

  return null;
}
