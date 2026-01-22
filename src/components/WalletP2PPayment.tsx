import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, X, ArrowRight, User, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WalletP2PPaymentProps {
    senderId: string;
    recipientId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export const WalletP2PPayment: React.FC<WalletP2PPaymentProps> = ({
    senderId,
    recipientId,
    onSuccess,
    onCancel
}) => {
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState<{ name: string; email: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchRecipientInfo();
    }, [recipientId]);

    const fetchRecipientInfo = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${recipientId}&select=name,email`,
                {
                    headers: {
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                }
            );
            const data = await response.json();
            if (data && data[0]) {
                setRecipient(data[0]);
            } else {
                toast.error('Destinatario no encontrado');
                onCancel();
            }
        } catch (error) {
            console.error('Error fetching recipient:', error);
            toast.error('Error al obtener datos del destinatario');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            toast.error('Ingresa un monto válido');
            return;
        }

        setIsSending(true);
        try {
            // Here we call a Supabase Edge Function to process the P2P transfer
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-p2p-transfer`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify({
                        fromUserId: senderId,
                        toUserId: recipientId,
                        amountUsd: numAmount,
                        description: `Pago P2P a ${recipient?.name}`
                    }),
                }
            );

            const result = await response.json();
            if (result.success) {
                toast.success('Envío completado exitosamente');
                onSuccess();
            } else {
                toast.error(result.error || 'No se pudo completar el envío');
            }
        } catch (error) {
            console.error('P2P Transfer Error:', error);
            toast.error('Error del servidor al procesar el envío');
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl text-center shadow-2xl">
                <Loader2 className="animate-spin mx-auto mb-4 text-mipana-orange" size={32} />
                <p className="font-bold text-gray-900 dark:text-white">Buscando destinatario...</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="bg-gradient-to-br from-mipana-darkBlue to-mipana-mediumBlue p-6 text-white text-center relative">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X size={18} />
                </button>
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg border border-white/20">
                    <User size={32} className="text-mipana-orange" />
                </div>
                <h3 className="text-xl font-black tracking-tight">{recipient?.name}</h3>
                <p className="text-xs text-white/60 font-medium tracking-widest uppercase">{recipient?.email}</p>
            </div>

            <div className="p-8 space-y-6">
                <div className="space-y-4">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest text-center">Monto a Enviar ($ USD)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-black text-gray-300">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-10 pr-4 py-6 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-mipana-orange outline-none rounded-2xl text-5xl font-black text-center text-mipana-darkBlue dark:text-white transition-all shadow-inner"
                        />
                    </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex gap-3 border border-blue-100 dark:border-blue-900/30">
                    <ShieldCheck className="text-mipana-mediumBlue flex-shrink-0" size={24} />
                    <div className="text-xs text-blue-900 dark:text-blue-200">
                        <p className="font-bold mb-1">Transferencia Segura</p>
                        <p>El envío se acredita al instante en la billetera de {recipient?.name}.</p>
                    </div>
                </div>

                <button
                    onClick={handleSend}
                    disabled={!amount || parseFloat(amount) <= 0 || isSending}
                    className="w-full bg-mipana-orange hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/30 transition-all flex items-center justify-center gap-3 group"
                >
                    {isSending ? (
                        <Loader2 size={24} className="animate-spin" />
                    ) : (
                        <>
                            Confirmar Envío <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-700 text-center">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">
                    Verificación de Identidad by Mi Pana Secure P2P
                </p>
            </div>
        </div>
    );
};
