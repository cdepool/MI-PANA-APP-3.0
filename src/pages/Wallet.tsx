
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, ArrowDownLeft, ArrowUpRight, Smartphone, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../components/Button';
import Input from '../components/Input';
import { getTariffs } from '../services/mockService';

const Wallet: React.FC = () => {
   const { user, walletTransaction, refreshBalance } = useAuth();
   const [showRecharge, setShowRecharge] = useState(false);
   const [amount, setAmount] = useState('');
   const [reference, setReference] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [activeTab, setActiveTab] = useState<'ALL' | 'DEPOSITS' | 'PAYMENTS'>('ALL');

   // Mock BCV Rate
   const bcvRate = getTariffs().currentBcvRate;

   if (!user) return null;

   const wallet = user.wallet || { balance: 0, transactions: [] };

   const handleRecharge = async () => {
      const amountBs = Number(amount);
      if (!amount || isNaN(amountBs) || amountBs <= 0) {
         alert("Monto inválido");
         return;
      }
      if (!reference || reference.length < 4) {
         alert("Ingresa los últimos 4 dígitos de referencia");
         return;
      }

      setIsLoading(true);
      try {
         // Convert Bs input to USD for internal storage
         const amountUsd = amountBs / bcvRate;

         // Simulate Deposit
         await walletTransaction(
            amountUsd,
            'DEPOSIT',
            'Recarga Pago Móvil',
            reference
         );
         setShowRecharge(false);
         setAmount('');
         setReference('');
         toast.success(`✅ Recarga de Bs ${amountBs} ($${amountUsd.toFixed(2)}) exitosa.`);
      } catch (e) {
         toast.error("Error procesando recarga.");
      } finally {
         setIsLoading(false);
      }
   };

   const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
         await refreshBalance();
         toast.success("Saldo actualizado");
      } catch (e) {
         toast.error("Error al actualizar saldo");
      } finally {
         setIsRefreshing(false);
      }
   };

   const filteredTransactions = wallet.transactions.filter(t => {
      if (activeTab === 'DEPOSITS') return t.type === 'DEPOSIT';
      if (activeTab === 'PAYMENTS') return t.type === 'PAYMENT' || t.type === 'WITHDRAWAL';
      return true;
   });

   return (
      <div className="space-y-6 animate-slide-up pb-20 max-w-3xl mx-auto">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <h2 className="text-2xl font-bold text-mipana-darkBlue dark:text-white flex items-center gap-2">
               <CreditCard className="text-mipana-mediumBlue" />
               Billetera Digital
            </h2>
            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-500">
               Tasa BCV: Bs {bcvRate.toFixed(2)}
            </span>
         </div>

         {/* Card Balance */}
         <div className="bg-gradient-to-br from-mipana-darkBlue to-[#011e45] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-mipana-orange opacity-10 rounded-full blur-xl"></div>

            <div className="relative z-10">
               <div className="flex justify-between items-start mb-1">
                  <p className="text-sm text-gray-300">Saldo Disponible</p>
                  <button
                     onClick={handleRefresh}
                     disabled={isRefreshing}
                     className="p-1.5 hover:bg-white/10 rounded-full transition-all active:scale-95 disabled:opacity-50"
                     title="Actualizar saldo"
                  >
                     <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
               </div>
               <div className="flex items-end gap-2 mb-4">
                  <h1 className="text-4xl font-bold tracking-tight">${wallet.balance.toFixed(2)}</h1>
                  <span className="text-lg text-gray-400 mb-1">USD</span>
               </div>

               <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/10 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
                  <RefreshCw size={12} />
                  <span>≈ Bs {(wallet.balance * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
               </div>

               <div className="mt-8 flex gap-3">
                  <button
                     onClick={() => setShowRecharge(true)}
                     className="flex-1 bg-mipana-orange hover:bg-orange-600 text-white py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                     <ArrowDownLeft size={18} /> Recargar
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 border border-white/20">
                     <ArrowUpRight size={18} /> Retirar
                  </button>
               </div>
            </div>
         </div>

         {/* Transactions List */}
         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
               <h3 className="font-bold dark:text-white">Movimientos Recientes</h3>
               <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  {['ALL', 'DEPOSITS', 'PAYMENTS'].map((tab) => (
                     <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeTab === tab
                           ? 'bg-white dark:bg-gray-600 text-mipana-darkBlue dark:text-white shadow-sm'
                           : 'text-gray-400 hover:text-gray-600'
                           }`}
                     >
                        {tab === 'ALL' ? 'Todos' : tab === 'DEPOSITS' ? 'Ingresos' : 'Egresos'}
                     </button>
                  ))}
               </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
               {filteredTransactions.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                     <Clock size={32} className="mx-auto mb-2 opacity-50" />
                     <p>No hay movimientos registrados.</p>
                  </div>
               ) : (
                  filteredTransactions.map(tx => (
                     <div key={tx.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-full ${tx.type === 'DEPOSIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {tx.type === 'DEPOSIT' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                           </div>
                           <div>
                              <p className="font-bold text-sm dark:text-gray-200">{tx.description}</p>
                              <p className="text-xs text-gray-400">
                                 {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 {tx.reference && <span className="ml-2 font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">Ref: {tx.reference}</span>}
                              </p>
                           </div>
                        </div>
                        <div className={`text-right font-bold ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-gray-800 dark:text-gray-200'}`}>
                           {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>

         {/* RECHARGE MODAL */}
         {showRecharge && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
               <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-mipana-darkBlue p-4 text-white flex justify-between items-center">
                     <h3 className="font-bold flex items-center gap-2"><Smartphone size={18} /> Recarga Pago Móvil</h3>
                     <button onClick={() => setShowRecharge(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><Clock size={18} /></button>
                  </div>

                  <div className="p-6 space-y-4">
                     <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg text-sm space-y-2 text-blue-800 dark:text-blue-200">
                        <p className="font-bold uppercase text-xs text-blue-500 mb-1">Datos para realizar el pago:</p>
                        <p><b>Banco:</b> Bancamiga (0272)</p>
                        <p><b>Teléfono:</b> 0414-5274111</p>
                        <p><b>RIF:</b> J-40724274-1</p>
                     </div>

                     <div>
                        <Input
                           label="Monto a Recargar (Bs)"
                           type="number"
                           placeholder="100.00"
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           icon={<span className="text-gray-500 font-bold text-xs">Bs</span>}
                        />
                        <p className="text-xs text-right mt-1 text-gray-500">
                           Equivalente: <b>$ {(Number(amount) / bcvRate).toFixed(2)}</b>
                        </p>
                     </div>

                     <Input
                        label="Últimos 4 dígitos de referencia"
                        type="text"
                        maxLength={4}
                        placeholder="Ej: 1234"
                        value={reference}
                        onChange={(e) => setReference(e.target.value.replace(/[^0-9]/g, ''))}
                     />

                     <Button fullWidth onClick={handleRecharge} disabled={isLoading}>
                        {isLoading ? 'Verificando...' : 'Confirmar Recarga'}
                     </Button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Wallet;
