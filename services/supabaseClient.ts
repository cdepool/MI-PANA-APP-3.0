
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

// Initialize with fallback to prevent crash, requests will fail gracefully
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
