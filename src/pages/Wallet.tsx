import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '../context/AuthContext';
import { WalletDashboard } from '../components/WalletDashboard';
import { DriverWalletDashboard } from '../components/conductor/DriverWalletDashboard';
import { BilleteraRestringida } from '../components/BilleteraRestringida';
// Lazy load heavy interaction component
const WalletRecharge = lazy(() => import('../components/WalletRecharge'));
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../types';

const WalletPage: React.FC = () => {
   const { user, isLoading } = useAuth();
   const [showRecharge, setShowRecharge] = useState(false);
   const [refreshKey, setRefreshKey] = useState(0);

   // DOMAIN SECURITY CHECK
   const isAuthorizedDomain = window.location.hostname.includes('v1.mipana.app') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1');

   if (!isAuthorizedDomain) {
      return <BilleteraRestringida />;
   }

   if (isLoading) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mipana-orange"></div>
         </div>
      );
   }

   if (!user) {
      // Should ideally redirect or show login prompt, but handling gracefully here
      return <div className="p-8 text-center">Inicia sesión para ver tu billetera.</div>;
   }

   const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
   };

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="min-h-screen bg-gray-50 dark:bg-gray-950"
      >
         {user.role === UserRole.DRIVER || user.role === 'conductor' ? (
            <DriverWalletDashboard
               key={refreshKey}
               userId={user.id}
               userName={user.name || user.email?.split('@')[0]}
            />
         ) : (
            <WalletDashboard
               key={refreshKey}
               userId={user.id}
               userName={user.name || user.email?.split('@')[0]}
               onRecharge={() => setShowRecharge(true)}
            />
         )}

         <AnimatePresence>
            {showRecharge && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <motion.div
                     initial={{ scale: 0.9, opacity: 0, y: 20 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     exit={{ scale: 0.9, opacity: 0, y: 20 }}
                     className="w-full max-w-md"
                  >
                     <Suspense fallback={<div className="p-8 bg-white rounded-2xl flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-mipana-orange rounded-full border-t-transparent"></div></div>}>
                        <WalletRecharge
                           userId={user.id}
                           userPhone={user.phone || ''}
                           onSuccess={() => {
                              handleRefresh();
                              setShowRecharge(false);
                           }}
                           onCancel={() => setShowRecharge(false)}
                        />
                     </Suspense>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </motion.div>
   );
};

export default WalletPage;
