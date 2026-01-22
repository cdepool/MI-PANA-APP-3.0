import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X, Share2, Download, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface WalletQRCodeProps {
    userId: string;
    userName: string;
    onClose: () => void;
}

export const WalletQRCode: React.FC<WalletQRCodeProps> = ({ userId, userName, onClose }) => {
    const [copied, setCopied] = React.useState(false);

    // The QR contains a deep link or special identifier
    const qrValue = `mipana://pay/${userId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(qrValue);
        setCopied(true);
        toast.success('Enlace de pago copiado');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const svg = document.getElementById('wallet-qr-code');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width + 40;
            canvas.height = img.height + 100;
            if (ctx) {
                // Draw background
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw QR
                ctx.drawImage(img, 20, 20);

                // Draw Text
                ctx.fillStyle = '#011e45';
                ctx.font = 'bold 16px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Mi Pana: ${userName}`, canvas.width / 2, img.height + 50);
                ctx.font = '12px Inter, sans-serif';
                ctx.fillText('Escanea para pagarme', canvas.width / 2, img.height + 70);

                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `QR_MiPana_${userName}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            }
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl"
            >
                {/* Decorative Header */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-mipana-darkBlue to-mipana-mediumBlue"></div>

                <div className="relative pt-8 pb-6 px-6 text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="inline-flex p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl mb-4 relative z-10">
                        <QrCode size={32} className="text-mipana-orange" />
                    </div>

                    <h2 className="relative z-10 text-xl font-bold text-white mb-1">Mi Código QR</h2>
                    <p className="relative z-10 text-sm text-white/70 mb-8">{userName}</p>

                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 mb-6 flex justify-center">
                        <div className="bg-white p-4 rounded-xl shadow-inner">
                            <QRCodeSVG
                                id="wallet-qr-code"
                                value={qrValue}
                                size={200}
                                level="H"
                                includeMargin={false}
                                imageSettings={{
                                    src: "/favicon.ico", // Attempt to include logo if available
                                    x: undefined,
                                    y: undefined,
                                    height: 40,
                                    width: 40,
                                    excavate: true,
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={handleCopy}
                            className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-mipana-orange/10 dark:hover:bg-mipana-orange/10 rounded-xl transition-all group"
                        >
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-mipana-darkBlue dark:text-gray-300 group-hover:text-mipana-orange transition-colors">
                                {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Copia</span>
                        </button>

                        <button
                            onClick={handleDownload}
                            className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-mipana-orange/10 dark:hover:bg-mipana-orange/10 rounded-xl transition-all group"
                        >
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-mipana-darkBlue dark:text-gray-300 group-hover:text-mipana-orange transition-colors">
                                <Download size={18} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Bajar</span>
                        </button>

                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: 'Pago Mi Pana',
                                        text: `Págale a ${userName} usando Mi Pana App`,
                                        url: qrValue
                                    });
                                } else {
                                    handleCopy();
                                }
                            }}
                            className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-mipana-orange/10 dark:hover:bg-mipana-orange/10 rounded-xl transition-all group"
                        >
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-mipana-darkBlue dark:text-gray-300 group-hover:text-mipana-orange transition-colors">
                                <Share2 size={18} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Enviar</span>
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                        Escanea para realizar pagos seguros P2P
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};
