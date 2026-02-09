import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function invokeEdgeFunction<T = any>(
    functionName: string,
    body: any
): Promise<T> {
    const { data, error } = await supabase.functions.invoke(functionName, {
        body,
    });

    if (error) {
        console.error(`Error invoking function ${functionName}:`, error);
        throw error;
    }

    return data as T;
}
