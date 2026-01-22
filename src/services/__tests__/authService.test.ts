import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../authService';

// Mock modules
vi.mock('../supabaseClient', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
            signInWithOAuth: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updateUser: vi.fn()
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
            maybeSingle: vi.fn()
        })),
        functions: {
            invoke: vi.fn()
        }
    }
}));

vi.mock('../../utils/logger', () => ({
    default: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn()
    }
}));

import { supabase } from '../supabaseClient';

describe('AuthService Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('loginWithPassword', () => {
        it('should login successfully with valid credentials', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: {
                    name: 'Test User',
                    role: 'passenger',
                    phone: '+58412345678'
                }
            };

            const mockSession = {
                access_token: 'mock-token',
                refresh_token: 'mock-refresh'
            };

            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: {
                    user: mockUser,
                    session: mockSession
                },
                error: null
            });

            const result = await authService.loginWithPassword('test@example.com', 'password123');

            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(result).toEqual({
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'passenger',
                phone: '+58412345678'
            });
        });

        it('should handle login failure with incorrect credentials', async () => {
            const mockError = {
                message: 'Invalid login credentials',
                status: 400
            };

            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: { user: null, session: null },
                error: mockError
            });

            try {
                await authService.loginWithPassword('wrong@example.com', 'wrongpass');
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).toContain('Invalid login credentials');
                // Verify no sensitive data in error
                expect(error.message).not.toContain('password');
            }
        });

        it('should convert username to email format', async () => {
            const mockUser = {
                id: 'user-456',
                email: 'usuario@mipana.app',
                user_metadata: { name: 'Usuario', role: 'driver' }
            };

            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: { user: mockUser, session: {} },
                error: null
            });

            await authService.loginWithPassword('usuario', 'password123');

            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'usuario@mipana.app',
                password: 'password123'
            });
        });
    });

    describe('registerUser', () => {
        it('should register new user with metadata', async () => {
            const mockUser = {
                id: 'new-user-123',
                email: 'newuser@example.com',
                user_metadata: {
                    name: 'New User',
                    role: 'passenger',
                    phone: '+58424567890'
                }
            };

            (supabase.auth.signUp as any).mockResolvedValue({
                data: { user: mockUser },
                error: null
            });

            const result = await authService.registerUser({
                email: 'newuser@example.com',
                password: 'securepass123',
                name: 'New User',
                phone: '+58424567890',
                role: 'passenger'
            });

            expect(supabase.auth.signUp).toHaveBeenCalledWith({
                email: 'newuser@example.com',
                password: 'securepass123',
                options: {
                    data: {
                        name: 'New User',
                        role: 'passenger',
                        phone: '+58424567890'
                    },
                    emailRedirectTo: expect.any(String)
                }
            });

            expect(result).toMatchObject({
                id: 'new-user-123',
                email: 'newuser@example.com',
                name: 'New User',
                role: 'passenger',
                phone: '+58424567890'
            });
        });

        it('should handle registration failure when email already exists', async () => {
            (supabase.auth.signUp as any).mockResolvedValue({
                data: { user: null },
                error: { message: 'User already registered' }
            });

            try {
                await authService.registerUser({
                    email: 'existing@example.com',
                    password: 'pass123',
                    name: 'Existing',
                    phone: '1234567890',
                    role: 'passenger'
                });
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error.message).toBe('Este correo ya está registrado.');
            }
        });
    });

    describe('logout', () => {
        it('should call signOut when logging out', async () => {
            (supabase.auth.signOut as any).mockResolvedValue({ error: null });

            await authService.logout();

            expect(supabase.auth.signOut).toHaveBeenCalled();
        });
    });

    describe('getProfile', () => {
        it('should fetch user profile by ID', async () => {
            const mockProfile = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'passenger'
            };

            const mockFrom = supabase.from as any;
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: mockProfile,
                    error: null
                })
            });

            const result = await authService.getProfile('user-123');

            expect(supabase.from).toHaveBeenCalledWith('profiles');
            expect(result.data).toEqual(mockProfile);
        });
    });

    describe('password recovery', () => {
        it('should request password reset email', async () => {
            (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({
                data: {},
                error: null
            });

            const result = await authService.requestPasswordReset('user@example.com');

            expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
                'user@example.com',
                expect.objectContaining({
                    redirectTo: expect.stringContaining('/reset-password')
                })
            );

            expect(result).toBeDefined();
        });

        it('should update password after reset', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };

            (supabase.auth.updateUser as any).mockResolvedValue({
                data: { user: mockUser },
                error: null
            });

            const result = await authService.updatePassword('newpassword123');

            expect(supabase.auth.updateUser).toHaveBeenCalledWith({
                password: 'newpassword123'
            });

            expect(result.user).toEqual(mockUser);
        });
    });
});
