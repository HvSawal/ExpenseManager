import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

const BASE_URL = 'https://api.frankfurter.app';

export interface ExchangeRateResponse {
    amount: number;
    base: string;
    date: string;
    rates: Record<string, number>;
}

/**
 * Fetches the exchange rate for a specific date.
 * Uses a caching strategy:
 * 1. Checks Supabase 'daily_exchange_rates' table.
 * 2. If missing, fetches from Frankfurter API (Base: USD) and caches it.
 * 
 * @param date The date for the exchange rate.
 * @param from The base currency code (e.g., 'USD').
 * @param to The target currency code (e.g., 'EUR').
 * @returns The exchange rate (1 unit of 'from' = X units of 'to').
 */
export const getHistoricalRate = async (date: Date, from: string, to: string): Promise<number> => {
    if (from === to) return 1;

    const dateStr = format(date, 'yyyy-MM-dd');

    try {
        // 1. Check Database Cache
        const { data: cachedData, error: _dbError } = await supabase
            .from('daily_exchange_rates')
            .select('rates')
            .eq('date', dateStr)
            .single();

        if (cachedData && cachedData.rates) {
            // Cache Hit
            const rates = cachedData.rates;
            // Calculate rate from USD base
            // Rate(From -> To) = Rate(USD -> To) / Rate(USD -> From)
            // Note: USD rate is 1.0
            const fromRate = from === 'USD' ? 1 : rates[from];
            const toRate = to === 'USD' ? 1 : rates[to];

            if (fromRate && toRate) {
                return toRate / fromRate;
            }
        }

        // 2. Cache Miss - Fetch from API
        // We fetch rates for ALL supported currencies relative to USD to populate the cache
        const symbols = 'EUR,GBP,INR,JPY'; // USD is base
        const response = await fetch(`${BASE_URL}/${dateStr}?from=USD&to=${symbols}`);

        if (!response.ok) {
            // If exact date fails (e.g. weekend/holiday), Frankfurter might return 404 or closest.
            // For now, let's try to fetch latest if it's today, or just fail.
            // Actually Frankfurter usually handles weekends by returning previous Friday.
            throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
        }

        const data: ExchangeRateResponse = await response.json();

        // 3. Store in Database (Lazy Cache)
        // We ignore errors here (e.g. duplicate key if another client inserted it)
        await supabase
            .from('daily_exchange_rates')
            .insert({
                date: dateStr,
                rates: data.rates
            })
            .select()
            .single();

        // 4. Return calculated rate
        const rates = data.rates;
        const fromRate = from === 'USD' ? 1 : rates[from];
        const toRate = to === 'USD' ? 1 : rates[to];

        if (!fromRate || !toRate) {
            throw new Error(`Exchange rate not available for ${from} to ${to} on ${dateStr}`);
        }

        return toRate / fromRate;

    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        throw error;
    }
};

/**
 * Fetches the latest exchange rate.
 * Currently just calls the API directly, but could also use caching if needed.
 */
export const getLatestRate = async (from: string, to: string): Promise<number> => {
    return getHistoricalRate(new Date(), from, to);
};
