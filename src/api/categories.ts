import { supabase } from '../lib/supabase';
import type { Category } from '../types';

const DEFAULT_CATEGORIES = [
    // Expenses
    { name: 'Food', type: 'expense', icon: '🍔', color: '#F59E0B' },
    { name: 'Shopping', type: 'expense', icon: '🛒', color: '#3B82F6' },
    { name: 'Housing', type: 'expense', icon: '🏠', color: '#6B7280' },
    { name: 'Transportation', type: 'expense', icon: '🚌', color: '#FCD34D' },
    { name: 'Vehicle', type: 'expense', icon: '🚗', color: '#EF4444' },
    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#8B5CF6' },
    { name: 'Laptop/PC', type: 'expense', icon: '💻', color: '#4B5563' },
    { name: 'Investments', type: 'expense', icon: '📈', color: '#10B981' },
    { name: 'Bills', type: 'expense', icon: '🧾', color: '#EF4444' },
    { name: 'Subscriptions', type: 'expense', icon: '🔄', color: '#6366F1' },
    { name: 'Gaming', type: 'expense', icon: '🎮', color: '#8B5CF6' },
    { name: 'Medical', type: 'expense', icon: '💊', color: '#EF4444' },
    { name: 'Gifts', type: 'expense', icon: '🎁', color: '#EC4899' },
    { name: 'Accomodations', type: 'expense', icon: '🏨', color: '#3B82F6' },
    { name: 'Travel', type: 'expense', icon: '✈️', color: '#0EA5E9' },
    { name: 'Cinema', type: 'expense', icon: '🍿', color: '#F59E0B' },
    { name: 'Pets', type: 'expense', icon: '🐾', color: '#78350F' },
    { name: 'Loans', type: 'expense', icon: '💸', color: '#EF4444' },
    { name: 'Beauty', type: 'expense', icon: '💄', color: '#EC4899' },
    { name: 'Electronics', type: 'expense', icon: '🔌', color: '#6B7280' },
    { name: 'Others', type: 'expense', icon: '📦', color: '#9CA3AF' },

    // Income
    { name: 'Investments', type: 'income', icon: '📈', color: '#10B981' },
    { name: 'Housing/Rental', type: 'income', icon: '🏠', color: '#3B82F6' },
    { name: 'Salary/Wages', type: 'income', icon: '💰', color: '#10B981' },
    { name: 'Bonus', type: 'income', icon: '💎', color: '#3B82F6' },
    { name: 'Gifts', type: 'income', icon: '🎁', color: '#EC4899' },
    { name: 'Deposits', type: 'income', icon: '🏦', color: '#10B981' },
    { name: 'Other', type: 'income', icon: '📦', color: '#9CA3AF' },
];

export const getCategories = async () => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

    if (error) throw error;

    // If categories exist, mark initialized and return
    if (data && data.length > 0) {
        localStorage.setItem('hasInitializedCategories', 'true');
        return data as Category[];
    }

    // If no categories and not initialized, create defaults
    if (!localStorage.getItem('hasInitializedCategories')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const categoriesWithUser = DEFAULT_CATEGORIES.map(cat => ({
                ...cat,
                created_by: user.id
            }));

            const { data: newCategories, error: insertError } = await supabase
                .from('categories')
                .insert(categoriesWithUser)
                .select();

            if (!insertError && newCategories) {
                localStorage.setItem('hasInitializedCategories', 'true');
                return newCategories as Category[];
            }
        }
    }

    return data as Category[];
};

export const createCategory = async (category: Omit<Category, 'id' | 'created_at' | 'created_by'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('categories')
        .insert([{ ...category, created_by: user.id }])
        .select()
        .single();

    if (error) throw error;
    return data as Category;
};

export const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Category;
};

export const deleteCategory = async (id: string) => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
