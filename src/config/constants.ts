
export const AUTH_CONFIG = {
    // Default timeout set to 3500ms (3.5s) for better stability in Venezuelan networks
    TIMEOUT_MS: Number(import.meta.env.VITE_AUTH_TIMEOUT_MS) || 3500,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY_MS: 1000
} as const;
