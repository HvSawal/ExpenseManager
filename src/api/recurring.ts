import { supabase } from '../lib/supabase';
import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter, startOfDay } from 'date-fns';
import type { RecurringExpense } from '../types';

export const getRecurringExpenses = async () => {
    const { data, error } = await supabase
        .from('recurring_expenses')
        .select(`
            *,
            category:categories(*),
            wallet:wallets(*)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as RecurringExpense[];
};

export const createRecurringExpense = async (data: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: newRule, error } = await supabase
        .from('recurring_expenses')
        .insert([{ ...data, created_by: user.id }])
        .select()
        .single();

    if (error) throw error;
    return newRule;
};

export const updateRecurringExpense = async (id: string, updates: any) => {
    const { data, error } = await supabase
        .from('recurring_expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteRecurringExpense = async (id: string) => {
    const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// Logic to process due expenses
export const processRecurringExpenses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get all active recurring expenses
    const { data: rules, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('created_by', user.id);

    if (error || !rules) return;

    const today = startOfDay(new Date());
    let processedCount = 0;

    for (const rule of rules) {
        // Determine the last time it was processed, or start date if never
        let nextDue = rule.last_processed
            ? new Date(rule.last_processed)
            : new Date(rule.start_date);

        // If it was already processed, calculate the NEXT occurrence
        if (rule.last_processed) {
            nextDue = calculateNextDate(nextDue, rule.frequency, rule.interval);
        }

        // Check if we passed the end date
        if (rule.end_date && isAfter(nextDue, new Date(rule.end_date))) {
            continue;
        }

        // While the next due date is today or in the past, generate expenses
        // Limit to 12 iterations to prevent infinite loops in case of bugs
        let iterations = 0;
        while ((isBefore(nextDue, today) || nextDue.getTime() === today.getTime()) && iterations < 12) {

            // Create the expense
            const { error: insertError } = await supabase
                .from('expenses')
                .insert([{
                    amount: rule.amount,
                    description: `${rule.description} (Recurring)`,
                    date: nextDue.toISOString(),
                    category_id: rule.category_id,
                    wallet_id: rule.wallet_id,
                    group_id: rule.group_id,
                    created_by: user.id
                }]);

            if (insertError) {
                console.error('Failed to generate recurring expense', insertError);
                break;
            }

            // Update the rule's last_processed date
            await supabase
                .from('recurring_expenses')
                .update({ last_processed: nextDue.toISOString() })
                .eq('id', rule.id);

            // Calculate next for the loop
            nextDue = calculateNextDate(nextDue, rule.frequency, rule.interval);
            processedCount++;
            iterations++;
        }
    }

    return processedCount;
};

const calculateNextDate = (current: Date, frequency: string, interval: number = 1): Date => {
    switch (frequency) {
        case 'daily': return addDays(current, interval);
        case 'weekly': return addWeeks(current, interval);
        case 'monthly': return addMonths(current, interval);
        case 'yearly': return addYears(current, interval);
        default: return addMonths(current, interval);
    }
};
