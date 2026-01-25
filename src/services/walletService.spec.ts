import { describe, it, expect, vi, beforeEach } from 'vitest';
import { walletService } from './walletService';
import { supabase } from './supabaseClient';

// Mock Supabase client
vi.mock('./supabaseClient', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(),
        },
    },
}));

describe('walletService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getBalance', () => {
        it('should fetch balance successfully', async () => {
            const mockResponse = {
                success: true,
                wallet: { balance_usd: 100, balance_ves: 5000 },
                exchange_rate: 50
            };

            // Allow fetch to be mocked globally if needed, strictly speaking getBalance uses fetch workaround
            // But if we stick to the code, it uses fetch directly in line 62.
            // We need to mock global fetch for getBalance because of the workaround.
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await walletService.getBalance('user-123');

            expect(result).toEqual({
                wallet: mockResponse.wallet,
                exchange_rate: mockResponse.exchange_rate
            });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('wallet-get-balance?userId=user-123'),
                expect.any(Object)
            );
        });

        it('should throw error on failure', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
            });

            await expect(walletService.getBalance('user-123'))
                .rejects.toThrow('Failed to fetch balance');
        });
    });

    describe('getTransactions', () => {
        it('should fetch transactions successfully', async () => {
            const mockData = {
                success: true,
                transactions: [{ id: 'tx-1', amount_usd: 10 }],
                total: 1,
                page: 1,
                limit: 10
            };

            (supabase.functions.invoke as any).mockResolvedValue({ data: mockData, error: null });

            const result = await walletService.getTransactions('user-123');

            expect(result).toEqual(mockData);
            expect(supabase.functions.invoke).toHaveBeenCalledWith('wallet-get-transactions', {
                body: { userId: 'user-123', type: 'all', limit: 10, offset: 0 }
            });
        });

        it('should handle API errors', async () => {
            (supabase.functions.invoke as any).mockResolvedValue({ data: null, error: { message: 'API Error' } });

            await expect(walletService.getTransactions('user-123'))
                .rejects.toThrow('API Error');
        });
    });

    describe('processTransaction', () => {
        it('should process transaction successfully', async () => {
            const mockProfile = { id: 'user-123', wallet: { balance: 90 } };
            const mockData = { success: true, profile: mockProfile };

            (supabase.functions.invoke as any).mockResolvedValue({ data: mockData, error: null });

            const result = await walletService.processTransaction('user-123', 10, 'payment', 'Test');

            expect(result).toEqual(mockProfile);
        });
    });
});
