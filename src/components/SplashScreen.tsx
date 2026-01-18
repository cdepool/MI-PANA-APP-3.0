import React from 'react';
import { motion } from 'framer-motion';

const SplashScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-mipana-darkBlue overflow-hidden">
            {/* Dynamic background elements */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[600px] h-[600px] bg-mipana-mediumBlue/20 rounded-full blur-[100px] -top-48 -left-48"
            />
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.05, 0.1, 0.05]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute w-[500px] h-[500px] bg-mipana-gold/10 rounded-full blur-[120px] -bottom-48 -right-48"
            />

            <div className="relative flex flex-col items-center">
                {/* Logo Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-8"
                >
                    <img
                        src="/login-logo.png"
                        alt="Mi Pana App"
                        className="w-32 h-32 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                    />
                </motion.div>

                {/* Brand Name */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 1 }}
                    className="text-center"
                >
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2">
                        MI PANA <span className="text-mipana-gold">APP</span>
                    </h1>
                    <div className="flex items-center justify-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-mipana-gold animate-pulse" />
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                            Innovando la movilidad
                        </p>
                    </div>
                </motion.div>

                {/* Progress indicator */}
                <div className="absolute -bottom-24 w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-mipana-gold to-transparent"
                    />
                </div>
            </div>

            <div className="absolute bottom-12 text-white/20 text-[9px] font-medium tracking-widest uppercase">
                Cargando Experiencia Premium
            </div>
        </div>
    );
};

export default SplashScreen;
