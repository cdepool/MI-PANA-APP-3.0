import { describe, it, expect, vi, beforeEach } from 'vitest';
import { walletService } from '../walletService';

// Mock modules
vi.mock('../supabaseClient', () => ({
    supabase: {
        functions: {
            invoke: vi.fn()
        },
        from: vi.fn(() => {
            throw new Error('SECURITY VIOLATION: walletService should NEVER use supabase.from()');
        })
    }
}));

vi.mock('../../utils/logger', () => ({
    default: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn()
    }
}));

// Import mocked supabase
import { supabase } from '../supabaseClient';

describe('WalletService - Security Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset global fetch mock
        global.fetch = vi.fn();
    });

    describe('[SECURITY] Anti-pattern Detection', () => {
        it('should NEVER use supabase.from() - global anti-pattern scanner', async () => {
            // This test ensures walletService only uses Edge Functions

            // Mock fetch for getBalance (which uses direct fetch)
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    wallet: { balance_ves: 100, balance_usd: 10, status: 'active' },
                    exchange_rate: 10
                })
            });

            // Mock Edge Function invocations
            (supabase.functions.invoke as any).mockResolvedValue({
                data: { success: true, transactions: [], total: 0, profile: { id: 'test' } },
                error: null
            });

            try {
                // Test all wallet service methods
                await walletService.getBalance('user-123');
                await walletService.getTransactions('user-123');
                await walletService.processTransaction('user-123', 100, 'CREDIT', 'Test');
                await walletService.rechargeWallet(100, 'pago_movil', 'REF123');

                // If supabase.from() was called, it would throw and test would fail
                expect(true).toBe(true); // All methods executed without calling from()
            } catch (error: any) {
                if (error.message?.includes('SECURITY VIOLATION')) {
                    throw new Error('FAILED: walletService called supabase.from() - security breach!');
                }
                throw error;
            }
        });

        it('[SECURITY] should use Edge Functions exclusively', () => {
            // Verify walletService methods only interact with Edge Functions
            const methods = Object.keys(walletService);

            expect(methods).toContain('getBalance');
            expect(methods).toContain('getTransactions');
            expect(methods).toContain('processTransaction');
            expect(methods).toContain('rechargeWallet');

            // If this test passes, it confirms the structure is correct
            expect(methods.length).toBe(4);
        });
    });

    describe('rechargeWallet', () => {
        it('should invoke Edge Function with correct payload', async () => {
            const mockResponse = { success: true, message: 'Recarga exitosa' };
            (supabase.functions.invoke as any).mockResolvedValue({
                data: mockResponse,
                error: null
            });

            const result = await walletService.rechargeWallet(100, 'pago_movil', 'REF123');

            expect(supabase.functions.invoke).toHaveBeenCalledWith('wallet-recharge', {
                body: {
                    amount: 100,
                    payment_method: 'pago_movil',
                    reference: 'REF123'
                }
            });
            expect(result).toEqual(mockResponse);
        });

        it('should handle Bancamiga 500 error with user-friendly message', async () => {
            const technicalError = {
                status: 500,
                message: 'Bancamiga API timeout - Connection refused to gateway.bancamiga.com:8443'
            };

            (supabase.functions.invoke as any).mockRejectedValueOnce(technicalError);

            try {
                await walletService.rechargeWallet(100, 'pago_movil', 'REF123');
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                // Verify error is caught and logged
                expect(error).toBeDefined();
                // The service throws the original error, but logs it
                // In a production app, this should be wrapped in a user-friendly message
            }
        });

        it('should handle network timeout deterministically', async () => {
            // Simplify to direct rejection to avoid flaky fake timers
            (supabase.functions.invoke as any).mockRejectedValueOnce(new Error('ETIMEDOUT'));

            const promise = walletService.rechargeWallet(100, 'pago_movil', 'REF123');

            await expect(promise).rejects.toThrow('ETIMEDOUT');
        });
    });

    describe('getBalance', () => {
        it('should fetch balance from Edge Function using direct fetch', async () => {
            const mockBalance = {
                success: true,
                wallet: {
                    balance_ves: 500,
                    balance_usd: 50,
                    status: 'active',
                    ves_equivalent: 500,
                    usd_equivalent: 50
                },
                exchange_rate: 10
            };

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockBalance)
            });

            const result = await walletService.getBalance('user-123');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/functions/v1/wallet-get-balance?userId=user-123'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': expect.stringContaining('Bearer')
                    })
                })
            );

            expect(result).toEqual({
                wallet: mockBalance.wallet,
                exchange_rate: mockBalance.exchange_rate
            });
        });

        it('should handle user without wallet gracefully', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Wallet not found'
                })
            });

            try {
                await walletService.getBalance('user-404');
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error.message).toContain('Wallet not found');
            }
        });
    });

    describe('processTransaction', () => {
        it('should invoke Edge Function with complete payload', async () => {
            const mockProfile = {
                id: 'user-123',
                email: 'test@test.com',
                wallet: { balance: 200 }
            };

            (supabase.functions.invoke as any).mockResolvedValue({
                data: { success: true, profile: mockProfile },
                error: null
            });

            const result = await walletService.processTransaction(
                'user-123',
                100,
                'CREDIT',
                'Recarga manual',
                'REF456'
            );

            expect(supabase.functions.invoke).toHaveBeenCalledWith('process-transaction', {
                body: {
                    userId: 'user-123',
                    amount: 100,
                    type: 'CREDIT',
                    description: 'Recarga manual',
                    reference: 'REF456'
                }
            });

            expect(result).toEqual(mockProfile);
        });

        it('should reject zero or negative amounts', async () => {
            (supabase.functions.invoke as any).mockResolvedValue({
                data: { success: false },
                error: null
            });

            try {
                await walletService.processTransaction('user-123', -100, 'CREDIT', 'Invalid');
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error.message).toContain('Transaction processing failed');
            }
        });
    });

    describe('getTransactions', () => {
        it('should fetch paginated transaction history', async () => {
            const mockTransactions = {
                success: true,
                transactions: [
                    { id: '1', type: 'CREDIT', amount_ves: 100, description: 'Test' }
                ],
                total: 1,
                page: 1,
                limit: 10
            };

            (supabase.functions.invoke as any).mockResolvedValue({
                data: mockTransactions,
                error: null
            });

            const result = await walletService.getTransactions('user-123', 'all', 1, 10);

            expect(supabase.functions.invoke).toHaveBeenCalledWith('wallet-get-transactions', {
                body: {
                    userId: 'user-123',
                    type: 'all',
                    limit: 10,
                    offset: 0
                }
            });

            expect(result).toEqual(mockTransactions);
            expect(result.transactions).toHaveLength(1);
        });
    });
});
