
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Strict validation: Fail fast if credentials are missing
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        '🔴 CRITICAL: Supabase credentials missing!\n\n' +
        'Required environment variables:\n' +
        '- VITE_SUPABASE_URL\n' +
        '- VITE_SUPABASE_ANON_KEY\n\n' +
        'Please check your .env file and ensure all variables are set.\n' +
        'See .env.example for reference.'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
