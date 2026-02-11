
export const AUTH_CONFIG = {
    // Increased to 8 seconds for better stability in Venezuelan networks
    // Previous 3.5s was causing premature session timeout on slow connections,
    // which made users get redirected to /welcome on every refresh
    TIMEOUT_MS: Number(import.meta.env.VITE_AUTH_TIMEOUT_MS) || 8000,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY_MS: 1000
} as const;
