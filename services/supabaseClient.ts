
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Strict validation: Log error but allow app to load (prevent WSOD)
if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        '🔴 CRITICAL: Supabase credentials missing!\n' +
        'Features requiring database will fail.\n' +
        'Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
}

// Initialize with fallback to prevent crash (WSOD) if env vars are missing
// This allows the app to load and show a proper error UI instead of a blank screen
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);
