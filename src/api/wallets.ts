import { supabase } from '../lib/supabase';
import type { Wallet } from '../types';

export const getWallets = async () => {
    const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('name');

    if (error) throw error;
    return data as Wallet[];
};

export const createWallet = async (wallet: Omit<Wallet, 'id' | 'created_at' | 'created_by'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('wallets')
        .insert([{ ...wallet, created_by: user.id }])
        .select()
        .single();

    if (error) throw error;
    return data as Wallet;
};

export const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    const { data, error } = await supabase
        .from('wallets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Wallet;
};

export const deleteWallet = async (id: string) => {
    const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
