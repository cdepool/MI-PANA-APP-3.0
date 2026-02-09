import { supabase } from './supabaseClient';
import { User, TransactionType } from '../types';
import logger from '../utils/logger';

export interface WalletBalance {
    balance_ves: number;
    balance_usd: number;
    status: string;
    ves_equivalent: number;
    usd_equivalent: number;
}

export interface WalletTransaction {
    id: string;
    type: string;
    amount_ves: number;
    amount_usd: number;
    description: string;
    created_at: string;
    status: string;
    reference?: string;
}

export interface TransactionResponse {
    success: boolean;
    transactions: WalletTransaction[];
    total: number;
    page: number;
    limit: number;
}

export const walletService = {
    /**
     * Obtiene el saldo actual y tasa de cambio
     * Invoca Edge Function 'wallet-get-balance'
     */
    getBalance: async (userId: string): Promise<{ wallet: WalletBalance; exchange_rate: number } | null> => {
        try {
            // Fetch via REST API to support query params
            // supabase.functions.invoke doesn't support query params easily in the URL constructor in current version

            // Invoke doesn't support query params easily in the first arg URL construction without raw URL
            // Workaround: We can use the raw URL fetch or modify the function to accept body.
            // But standard supabase.functions.invoke sends POST by default unless specified.
            // The existing function checks 'GET'. 
            // We should use fetch directly or fix the function to accept POST. 
            // Re-reading wallet-get-balance: "if (req.method !== 'GET')".

            // To stick to "SECURITY FIRST", we should probably use POST for everything to pass body.
            // But assuming we can't change the remote function immediately without deployment, 
            // we will try to use the fetch directly or construct valid URL.

            // Better approach complying with "Clean Code":
            // Use supabase.functions.invoke but let's change protocol? 

            // Use direct fetch for GET to Supabase Functions to support query params
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-get-balance?userId=${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch balance');

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            return {
                wallet: result.wallet,
                exchange_rate: result.exchange_rate
            };

        } catch (error) {
            logger.error('Error fetching wallet balance:', error);
            throw error;
        }
    },

    /**
     * Obtiene historial de transacciones (Paginado)
     * Invoca Edge Function 'wallet-get-transactions'
     */
    getTransactions: async (userId: string, type: string = 'all', page: number = 1, limit: number = 10): Promise<TransactionResponse> => {
        try {
            const offset = (page - 1) * limit;

            const { data, error } = await supabase.functions.invoke('wallet-get-transactions', {
                body: { userId, type, limit, offset }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            return data as TransactionResponse;
        } catch (error) {
            logger.error('Error fetching transactions:', error);
            throw error;
        }
    },

    /**
     * Procesa una transacción (Pago, Cobro)
     * Invoca Edge Function 'process-transaction'
     */
    processTransaction: async (userId: string, amount: number, type: TransactionType, description: string, reference?: string): Promise<User> => {
        try {
            const { data, error } = await supabase.functions.invoke('process-transaction', {
                body: { userId, amount, type, description, reference }
            });

            if (error) throw new Error(error.message || 'Transaction failed');
            if (!data?.success || !data?.profile) throw new Error('Transaction processing failed');

            return data.profile as User;
        } catch (error) {
            logger.error('Transaction processing error:', error);
            throw error;
        }
    },

    /**
     * Recarga de Billetera
     * Invoca Edge Function 'wallet-recharge'
     */
    rechargeWallet: async (amount: number, paymentMethod: string, reference: string): Promise<any> => {
        try {
            const { data, error } = await supabase.functions.invoke('wallet-recharge', {
                body: { amount, payment_method: paymentMethod, reference }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Wallet recharge error:', error);
            throw error;
        }
    }
};
