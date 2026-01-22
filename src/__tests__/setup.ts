import { vi, beforeEach, afterEach } from 'vitest';

// ANTI-PATTERN: Mock supabase.from to track calls (for security tests)
export const mockSupabase = {
    auth: {
        signInWithPassword: vi.fn(),
        signInWithOAuth: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn()
    },
    from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn()
    })),
    functions: {
        invoke: vi.fn()
    }
};

// Mock logger to avoid console noise
export const mockLogger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
};

// Reset all mocks between tests
beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});
