import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../authService';
import { supabase } from '../supabaseClient';

// Mock Supabase
vi.mock('../supabaseClient', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updateUser: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
        })),
    },
}));

describe('AuthService Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('loginWithPassword', () => {
        it('should login successfully and return user data', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@mipana.app',
                user_metadata: { name: 'Test User', role: 'passenger', phone: '123456789' },
            };

            (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
                data: { user: mockUser },
                error: null,
            });

            const result = await authService.loginWithPassword('test@mipana.app', 'password123');

            expect(result.id).toBe('user-123');
            expect(result.name).toBe('Test User');
            expect(result.role).toBe('passenger');
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@mipana.app',
                password: 'password123',
            });
        });

        it('should throw error when login fails', async () => {
            (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Invalid credentials' },
            });

            await expect(authService.loginWithPassword('test@mipana.app', 'wrong')).rejects.toThrow();
        });
    });

    describe('registerUser', () => {
        it('should register successfully', async () => {
            const registrationData = {
                email: 'new@mipana.app',
                password: 'password123',
                name: 'New User',
                phone: '987654321',
                role: 'passenger' as const,
            };

            (supabase.auth.signUp as any).mockResolvedValueOnce({
                data: { user: { id: 'new-user-id' } },
                error: null,
            });

            const result = await authService.registerUser(registrationData);

            expect(result.id).toBe('new-user-id');
            expect(result.email).toBe('new@mipana.app');
            expect(supabase.auth.signUp).toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        it('should call signOut', async () => {
            await authService.logout();
            expect(supabase.auth.signOut).toHaveBeenCalled();
        });
    });
});
