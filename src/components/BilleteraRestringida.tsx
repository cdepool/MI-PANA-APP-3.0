import React from 'react';
import { ShieldAlert, ExternalLink, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export const BilleteraRestringida: React.FC = () => {
    const authorizedDomain = 'v1.mipana.app';
    const currentHostname = window.location.hostname;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
            >
                {/* Header con gradiente de seguridad */}
                <div className="bg-gradient-to-br from-mipana-darkBlue to-mipana-mediumBlue p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-mipana-orange/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="bg-white/10 backdrop-blur-md w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border border-white/20 shadow-xl mb-4 relative z-10">
                        <Lock size={40} className="text-mipana-orange" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight relative z-10">Acceso Restringido</h2>
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-2 relative z-10">Protocolo de Seguridad Bancaria</p>
                </div>

                {/* Contenido */}
                <div className="p-8 space-y-6 text-center">
                    <div className="space-y-2">
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Hola, mi pana. Por motivos de seguridad y cumplimento con las normativas de **Bancamiga**, tu billetera solo puede operar en nuestro dominio oficial.
                        </p>
                        <div className="bg-red-50 p-3 rounded-2xl flex items-center gap-3 border border-red-100 mt-4">
                            <ShieldAlert className="text-red-500 shrink-0" size={20} />
                            <div className="text-left">
                                <p className="text-[10px] font-black text-red-800 uppercase">Origen Detectado</p>
                                <p className="text-xs font-bold text-red-600 truncate">{currentHostname}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <a
                            href={`https://${authorizedDomain}/billetera`}
                            className="w-full py-4 bg-mipana-darkBlue hover:bg-black text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                        >
                            Ir al Dominio Seguro
                            <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>

                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter leading-normal">
                            Este bloqueo protege tus fondos y garantiza que las transacciones ocurran en un entorno certificado.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                        Tecnología Bancamiga Verificada by SITCA
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
