import { describe, it, expect, vi, beforeEach } from 'vitest';
import { walletService } from '../walletService';
import { supabase } from '../supabaseClient';

// Mock Supabase
vi.mock('../supabaseClient', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(),
        },
    },
}));

// Mock global fetch
global.fetch = vi.fn();

describe('WalletService Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getBalance', () => {
        it('should fetch balance successfully via fetch fallback', async () => {
            const mockResult = {
                success: true,
                wallet: { balance_usd: 50.5, balance_ves: 1800 },
                exchange_rate: 36.5
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResult,
            });

            const result = await walletService.getBalance('user-123');

            expect(result?.wallet.balance_usd).toBe(50.5);
            expect(result?.exchange_rate).toBe(36.5);
            expect(global.fetch).toHaveBeenCalled();
        });

        it('should throw error when fetch fails', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
            });

            await expect(walletService.getBalance('user-123')).rejects.toThrow('Failed to fetch balance');
        });
    });

    describe('rechargeWallet', () => {
        it('should call wallet-recharge Edge Function', async () => {
            const mockResponse = { data: { success: true, message: 'Recharge initiated' }, error: null };
            (supabase.functions.invoke as any).mockResolvedValue(mockResponse);

            const result = await walletService.rechargeWallet('user123', '584141234567', 100, '0172', '1234');

            expect(result.success).toBe(true);
            expect(supabase.functions.invoke).toHaveBeenCalledWith('wallet-recharge', {
                body: {
                    userId: 'user123',
                    userPhone: '584141234567',
                    amount: 100,
                    bancoOrig: '0172',
                    lastFourDigits: '1234'
                }
            });
        });

        it('should handle Bancamiga/Edge Function errors', async () => {
            (supabase.functions.invoke as any).mockResolvedValueOnce({
                data: null,
                error: { message: 'Bancamiga timeout' },
            });

            await expect(walletService.rechargeWallet(100, 'bancamiga', 'ref123')).rejects.toThrow('Bancamiga timeout');
        });
    });

    describe('processTransaction', () => {
        it('should invoke process-transaction function', async () => {
            const mockProfile = { id: 'user-123', name: 'User' };
            (supabase.functions.invoke as any).mockResolvedValueOnce({
                data: { success: true, profile: mockProfile },
                error: null
            });

            const result = await walletService.processTransaction('user-123', 10, 'ride_payment', 'Pago viaje');

            expect(result.id).toBe('user-123');
            expect(supabase.functions.invoke).toHaveBeenCalledWith('process-transaction', expect.anything());
        });
    });

    // Anti-pattern validation: Ensure no direct DB mutations for sensitive data
    it('should not contain direct supabase.from("wallets") calls', async () => {
        // This is a meta-test to enforce architecture
        const fs = await import('fs');
        const serviceContent = fs.readFileSync('src/services/walletService.ts', 'utf8');
        expect(serviceContent).not.toContain('.from(\'wallets\')');
        expect(serviceContent).not.toContain('.from("wallets")');
    });
});
