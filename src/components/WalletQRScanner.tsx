import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, AlertCircle, Loader2 } from 'lucide-react';

interface WalletQRScannerProps {
    onScan: (result: string) => void;
    onClose: () => void;
}

export const WalletQRScanner: React.FC<WalletQRScannerProps> = ({ onScan, onClose }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            false
        );

        scanner.render(
            (decodedText) => {
                // Stop scanner on success
                scanner.clear();
                onScan(decodedText);
            },
            (errorMessage) => {
                // Low level errors can be ignored unless critical
                // console.warn(errorMessage);
            }
        );

        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Error clearing scanner", err));
            }
        };
    }, [onScan]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-mipana-orange/10 rounded-lg text-mipana-orange">
                            <Camera size={20} />
                        </div>
                        <h2 className="font-bold text-gray-900 dark:text-white">Escanear Pago</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div id="qr-reader" className="overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        {/* html5-qrcode will render here */}
                        <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                            <Loader2 size={32} className="text-mipana-orange animate-spin" />
                            <p className="text-sm text-gray-500 font-medium tracking-tight">Cargando cámara...</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl flex gap-3 items-start border border-red-100 dark:border-red-900/30">
                            <AlertCircle size={20} className="text-red-500 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-bold text-red-900 dark:text-red-200">Error de Cámara</p>
                                <p className="text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                            Enfoca el código QR de Mi Pana <br /> para procesar el pago instantáneo
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
                        Tecnología Mi Pana Secure Scan
                    </p>
                </div>
            </div>

            {/* Custom Styles to hide the library text UI */}
            <style>{`
        #qr-reader__dashboard { display: none !important; }
        #qr-reader__status_span { display: none !important; }
        #qr-reader video { border-radius: 1rem; width: 100% !important; height: auto !important; }
        #qr-reader img { display: none; }
        #qr-reader { border: none !important; }
      `}</style>
        </motion.div>
    );
};
