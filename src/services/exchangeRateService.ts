import { supabase } from '../utils/supabaseClient';
import logger from '../utils/logger';

interface ExchangeRateSource {
    name: string;
    fetchRate: () => Promise<{ rate: number; date: string }>;
}

const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Multi-source exchange rate fetcher with fallback strategy
 * 
 * Priority order:
 * 1. Manual override (localStorage)
 * 2. DolarAPI.com
 * 3. Supabase database
 * 4. Hardcoded emergency fallback
 */

// Source 1: DolarAPI.com
const fetchFromDolarAPI = async (): Promise<{ rate: number; date: string }> => {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    if (!response.ok) throw new Error(`DolarAPI HTTP ${response.status}`);

    const data = await response.json();
    return {
        rate: data.promedio,
        date: data.fechaActualizacion
    };
};

// Source 2: Supabase database
const fetchFromSupabase = async (): Promise<{ rate: number; date: string }> => {
    const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate, effective_date')
        .eq('rate_type', 'oficial')
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();

    if (error) throw error;
    if (!data) throw new Error('No exchange rate found in database');

    return {
        rate: data.rate,
        date: data.effective_date
    };
};

const SOURCES: ExchangeRateSource[] = [
    {
        name: 'DolarAPI',
        fetchRate: fetchFromDolarAPI
    },
    {
        name: 'Supabase',
        fetchRate: fetchFromSupabase
    }
];

/**
 * Check if exchange rate data is fresh (less than 48h old)
 */
const isFresh = (dateString: string): boolean => {
    const age = Date.now() - new Date(dateString).getTime();
    return age < MAX_AGE_MS;
};

/**
 * Get manual override rate from localStorage if available and not expired
 */
const getManualOverride = (): number | null => {
    try {
        const override = localStorage.getItem('bcv_rate_override');
        if (!override) return null;

        const { rate, expiry } = JSON.parse(override);
        if (Date.now() < expiry) {
            logger.log('✅ Using manual BCV rate override:', rate);
            return rate;
        } else {
            // Expired, clean up
            localStorage.removeItem('bcv_rate_override');
            return null;
        }
    } catch (error) {
        logger.warn('Failed to parse manual override:', error);
        return null;
    }
};

/**
 * Set manual override rate (valid for 24 hours by default)
 */
export const setManualBcvOverride = (rate: number, validHours: number = 24): void => {
    const expiry = Date.now() + (validHours * 60 * 60 * 1000);
    localStorage.setItem('bcv_rate_override', JSON.stringify({
        rate,
        expiry,
        updatedBy: 'admin',
        timestamp: new Date().toISOString()
    }));
    logger.log(`✅ Manual BCV override set: ${rate} Bs (valid for ${validHours}h)`);
};

/**
 * Main function: Fetch BCV rate with multi-source fallback
 */
export const fetchBcvRateWithFallback = async (): Promise<{ rate: number; source: string; isFresh: boolean }> => {
    // Priority 1: Check manual override
    const override = getManualOverride();
    if (override) {
        return { rate: override, source: 'manual_override', isFresh: true };
    }

    // Priority 2-3: Try sources in order
    for (const source of SOURCES) {
        try {
            logger.log(`🔄 Fetching BCV rate from ${source.name}...`);
            const { rate, date } = await source.fetchRate();
            const fresh = isFresh(date);

            if (fresh) {
                logger.log(`✅ Fresh rate from ${source.name}: ${rate} Bs (updated: ${date})`);
                return { rate, source: source.name, isFresh: true };
            } else {
                const ageHours = Math.round((Date.now() - new Date(date).getTime()) / (60 * 60 * 1000));
                logger.warn(`⚠️ ${source.name} has stale data (${ageHours}h old), trying next source...`);
            }
        } catch (error) {
            logger.warn(`❌ ${source.name} failed:`, error);
            continue;
        }
    }

    // Priority 4: Emergency hardcoded fallback
    logger.error('❌ All sources failed or returned stale data, using hardcoded fallback');
    return {
        rate: 352.71, // ⬅️ UPDATE MANUALLY WHEN NEEDED
        source: 'hardcoded_fallback',
        isFresh: false
    };
};

/**
 * Get age of exchange rate data in hours
 */
export const getRateAge = (dateString: string): number => {
    const ageMs = Date.now() - new Date(dateString).getTime();
    return Math.round(ageMs / (60 * 60 * 1000));
};
