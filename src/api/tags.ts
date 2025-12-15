import { supabase } from '../lib/supabase';
import type { Tag } from '../types';

const DEFAULT_TAGS = [
    { name: 'Vegetables', color: '#10B981' },
    { name: 'Fruits', color: '#F59E0B' },
    { name: 'Groceries', color: '#3B82F6' },
    { name: 'Other', color: '#9CA3AF' },
    { name: 'One Time', color: '#8B5CF6' },
];

export const getTags = async () => {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

    if (error) throw error;

    // If tags exist, mark initialized and return
    if (data && data.length > 0) {
        localStorage.setItem('hasInitializedTags_v2', 'true');
        return data as Tag[];
    }

    // If no tags and not initialized, create defaults
    if (!localStorage.getItem('hasInitializedTags_v2')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const tagsWithUser = DEFAULT_TAGS.map(tag => ({
                ...tag,
                created_by: user.id
            }));

            const { data: newTags, error: insertError } = await supabase
                .from('tags')
                .insert(tagsWithUser)
                .select();

            if (insertError) {
                console.error('Error auto-populating tags:', insertError);
            }

            if (!insertError && newTags) {
                localStorage.setItem('hasInitializedTags_v2', 'true');
                return newTags as Tag[];
            }
        }
    }

    return data as Tag[];
};

export const createTag = async (tag: Omit<Tag, 'id' | 'created_at' | 'created_by'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('tags')
        .insert([{ ...tag, created_by: user.id }])
        .select()
        .single();

    if (error) throw error;
    return data as Tag;
};

export const updateTag = async (id: string, updates: Partial<Tag>) => {
    const { data, error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Tag;
};

export const deleteTag = async (id: string) => {
    const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
