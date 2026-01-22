import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { WalletDashboard } from '../components/WalletDashboard';
import { DriverWalletDashboard } from '../components/conductor/DriverWalletDashboard';
import { WalletRecharge } from '../components/WalletRecharge';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../types';

const WalletPage: React.FC = () => {
   const { user, refreshBalance } = useAuth();
   const [showRecharge, setShowRecharge] = useState(false);

   if (!user) return null;

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="min-h-screen bg-gray-50 dark:bg-gray-950"
      >
         <WalletDashboard
            userId={user.id}
            userName={user.name}
            onRecharge={() => setShowRecharge(true)}
         />

         <AnimatePresence>
            {showRecharge && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <motion.div
                     initial={{ scale: 0.9, opacity: 0, y: 20 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     exit={{ scale: 0.9, opacity: 0, y: 20 }}
                     className="w-full max-w-md"
                  >
                     <WalletRecharge
                        userId={user.id}
                        userPhone={user.phone || ''}
                        onSuccess={() => {
                           refreshBalance();
                           setShowRecharge(false);
                        }}
                        onCancel={() => setShowRecharge(false)}
                     />
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </motion.div>
   );
};

export default WalletPage;
