import { supabase } from '../lib/supabase';
import type { Group, GroupMember } from '../types';

export const getGroups = async () => {
    const { data, error } = await supabase
        .from('expense_groups')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Group[];
};

export const createGroup = async (name: string, description?: string) => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const payload = {
        name,
        description,
        created_by: user.id
    };

    const { data, error } = await supabase
        .from('expense_groups')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;

    // Add creator as admin
    const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
            group_id: data.id,
            user_id: user.id,
            role: 'admin',
            permissions: {
                can_add_expense: true,
                can_edit_expense: true,
                can_delete_expense: true,
                can_manage_categories: true,
                can_manage_tags: true,
                can_manage_wallets: true,
                can_invite_members: true,
                can_view_reports: true
            }
        }]);

    if (memberError) throw memberError;

    return data as Group;
};

export const getGroupDetails = async (groupId: string) => {
    const { data, error } = await supabase
        .from('expense_groups')
        .select('*')
        .eq('id', groupId)
        .single();

    if (error) throw error;
    return data as Group;
};

export const getGroupMembers = async (groupId: string) => {
    const { data, error } = await supabase
        .from('group_members')
        .select(`
      *,
      profile:user_profiles(*)
    `)
        .eq('group_id', groupId);

    if (error) throw error;
    return data as GroupMember[];
};

export const inviteMember = async (groupId: string, email: string) => {
    // In a real app, this would send an email. 
    // For now, we'll just create an invitation record.
    const { data, error } = await supabase
        .from('invitations')
        .insert([{
            group_id: groupId,
            email,
            token: crypto.randomUUID(),
            status: 'pending'
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};
