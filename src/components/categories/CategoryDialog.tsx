import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    Stack
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, updateCategory } from '../../api/categories';
import type { Category } from '../../types';
import toast from 'react-hot-toast';

interface CategoryDialogProps {
    open: boolean;
    onClose: () => void;
    categoryToEdit?: Category | null;
    defaultType?: 'expense' | 'income';
}

interface CategoryFormData {
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string;
}

const ICONS = [
    '💰', '🏠', '🚗', '🍔', '🎮', '💊', '✈️', '🎓', '🎁', '🔧', '🛒', '💡',
    '🍕', '🍺', '☕', '🍦', '🎬', '🎵', '📚', '🏋️', '⛽', '🚕', '🚂', '🚲',
    '📱', '💻', '🧺', '🛁', '🏥', '🦷', '👓', '👗', '👠', '🕶️', '👶', '🐾'
];
const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280'];

import { useUI } from '../../contexts/UIContext';

const CategoryDialog = ({ open, onClose, categoryToEdit, defaultType = 'expense' }: CategoryDialogProps) => {
    const queryClient = useQueryClient();
    const { showError } = useUI();
    const { register, handleSubmit, reset, setValue, watch } = useForm<CategoryFormData>({
        defaultValues: {
            name: '',
            type: defaultType,
            color: COLORS[0],
            icon: ICONS[0]
        }
    });

    const selectedColor = watch('color');
    const selectedIcon = watch('icon');

    useEffect(() => {
        if (categoryToEdit) {
            reset({
                name: categoryToEdit.name,
                type: categoryToEdit.type,
                color: categoryToEdit.color,
                icon: categoryToEdit.icon
            });
        } else {
            reset({
                name: '',
                type: defaultType,
                color: COLORS[0],
                icon: ICONS[0]
            });
        }
    }, [categoryToEdit, reset, open, defaultType]);

    const mutation = useMutation({
        mutationFn: (data: CategoryFormData) => {
            if (categoryToEdit) {
                return updateCategory(categoryToEdit.id, data);
            }
            return createCategory(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success(`Category ${categoryToEdit ? 'updated' : 'created'} successfully`);
            onClose();
        },
        onError: (error: any) => {
            showError('Failed to Save Category', error.message || 'An unexpected error occurred while saving the category.');
        }
    });

    const onSubmit = (data: CategoryFormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{categoryToEdit ? 'Edit Category' : 'New Category'}</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            {...register('name', { required: 'Name is required' })}
                            label="Category Name"
                            fullWidth
                            autoFocus
                        />

                        <TextField
                            {...register('type')}
                            select
                            label="Type"
                            fullWidth
                        >
                            <MenuItem value="expense">Expense</MenuItem>
                            <MenuItem value="income">Income</MenuItem>
                        </TextField>

                        <Box>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                            <div className="flex flex-wrap gap-2">
                                {ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setValue('icon', icon)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 transition-colors ${selectedIcon === icon
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-transparent hover:bg-gray-100'
                                            }`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </Box>

                        <Box>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setValue('color', color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform ${selectedColor === color
                                            ? 'border-gray-900 scale-110'
                                            : 'border-transparent hover:scale-110'
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CategoryDialog;
