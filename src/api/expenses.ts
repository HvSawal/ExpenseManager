import { supabase } from '../lib/supabase';
import type { Expense, ExpenseFormData } from '../types';
import { addDays, addWeeks, addMonths, addYears, isAfter } from 'date-fns';

export const getExpenses = async () => {
    const { data, error } = await supabase
        .from('expenses')
        .select(`
      *,
      category:categories(*),
      wallet:wallets(*),
      expense_tags(tag:tags(*))
    `)
        .order('date', { ascending: false });

    if (error) throw error;

    // Transform data to match Expense interface
    return data.map((item: any) => ({
        ...item,
        tags: item.expense_tags?.map((et: any) => et.tag) || [],
    })) as Expense[];
};

export const createExpense = async (expense: ExpenseFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Create the initial expense
    const { data: initialExpense, error } = await supabase
        .from('expenses')
        .insert([{
            amount: expense.amount,
            description: expense.description,
            date: expense.date.toISOString(),
            category_id: expense.category_id,
            wallet_id: expense.wallet_id,
            group_id: expense.group_id || null,
            currency: expense.currency,
            created_by: user.id,
            status: 'completed' // Default to completed for the initial entry
        }])
        .select()
        .single();

    if (error) throw error;

    // Handle tags for initial expense
    if (expense.tag_ids.length > 0) {
        const expenseTags = expense.tag_ids.map(tagId => ({
            expense_id: initialExpense.id,
            tag_id: tagId
        }));

        const { error: tagError } = await supabase
            .from('expense_tags')
            .insert(expenseTags);

        if (tagError) throw tagError;
    }

    // 2. Handle Recurrence
    if (expense.recurrence) {
        const { frequency, interval, end_date } = expense.recurrence;

        // Create recurring_expenses record
        const { data: recurringRule, error: recurringError } = await supabase
            .from('recurring_expenses')
            .insert([{
                expense_id: initialExpense.id,
                frequency,
                interval,
                start_date: expense.date.toISOString(),
                end_date: end_date ? end_date.toISOString() : null,
                last_processed: expense.date.toISOString()
            }])
            .select()
            .single();

        if (recurringError) throw recurringError;

        // Update initial expense with recurring_expense_id
        await supabase
            .from('expenses')
            .update({ recurring_expense_id: recurringRule.id })
            .eq('id', initialExpense.id);

        // Generate future expenses
        const futureExpenses = [];
        let nextDate = new Date(expense.date);
        const cutoffDate = end_date || addYears(new Date(), 1);

        while (true) {
            switch (frequency) {
                case 'daily':
                    nextDate = addDays(nextDate, interval);
                    break;
                case 'weekly':
                    nextDate = addWeeks(nextDate, interval);
                    break;
                case 'monthly':
                    nextDate = addMonths(nextDate, interval);
                    break;
                case 'yearly':
                    nextDate = addYears(nextDate, interval);
                    break;
            }

            if (isAfter(nextDate, cutoffDate)) break;

            futureExpenses.push({
                amount: expense.amount,
                description: expense.description,
                date: nextDate.toISOString(),
                category_id: expense.category_id,
                wallet_id: expense.wallet_id,
                group_id: expense.group_id || null,
                currency: expense.currency,
                created_by: user.id,
                status: 'pending',
                recurring_expense_id: recurringRule.id
            });
        }

        if (futureExpenses.length > 0) {
            const { data: createdFutureExpenses, error: futureError } = await supabase
                .from('expenses')
                .insert(futureExpenses)
                .select();

            if (futureError) throw futureError;

            // Add tags to future expenses
            if (expense.tag_ids.length > 0 && createdFutureExpenses) {
                const allTags = createdFutureExpenses.flatMap(exp =>
                    expense.tag_ids.map(tagId => ({
                        expense_id: exp.id,
                        tag_id: tagId
                    }))
                );

                await supabase.from('expense_tags').insert(allTags);
            }
        }
    }

    return initialExpense;
};

export const updateExpense = async (id: string, expense: ExpenseFormData) => {
    const { data, error } = await supabase
        .from('expenses')
        .update({
            amount: expense.amount,
            description: expense.description,
            date: expense.date.toISOString(),
            category_id: expense.category_id,
            wallet_id: expense.wallet_id,
            currency: expense.currency,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    // Update tags (delete all and re-insert)
    const { error: deleteTagsError } = await supabase
        .from('expense_tags')
        .delete()
        .eq('expense_id', id);

    if (deleteTagsError) throw deleteTagsError;

    if (expense.tag_ids.length > 0) {
        const expenseTags = expense.tag_ids.map(tagId => ({
            expense_id: id,
            tag_id: tagId
        }));

        const { error: tagError } = await supabase
            .from('expense_tags')
            .insert(expenseTags);

        if (tagError) throw tagError;
    }

    return data;
};

export const deleteExpense = async (id: string) => {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
