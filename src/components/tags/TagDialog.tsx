import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTag, updateTag } from '../../api/tags';
import type { Tag } from '../../types';
import toast from 'react-hot-toast';

interface TagDialogProps {
    open: boolean;
    onClose: () => void;
    tagToEdit?: Tag | null;
}

interface TagFormData {
    name: string;
    color: string;
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280'];

import { useUI } from '../../contexts/UIContext';

const TagDialog = ({ open, onClose, tagToEdit }: TagDialogProps) => {
    const queryClient = useQueryClient();
    const { showError } = useUI();
    const { register, handleSubmit, reset, setValue, watch } = useForm<TagFormData>({
        defaultValues: {
            name: '',
            color: COLORS[0]
        }
    });

    const selectedColor = watch('color');

    useEffect(() => {
        if (tagToEdit) {
            reset({
                name: tagToEdit.name,
                color: tagToEdit.color
            });
        } else {
            reset({
                name: '',
                color: COLORS[0]
            });
        }
    }, [tagToEdit, reset, open]);

    const mutation = useMutation({
        mutationFn: (data: TagFormData) => {
            if (tagToEdit) {
                return updateTag(tagToEdit.id, data);
            }
            return createTag(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            toast.success(`Tag ${tagToEdit ? 'updated' : 'created'} successfully`);
            onClose();
        },
        onError: (error: any) => {
            showError('Failed to Save Tag', error.message || 'An unexpected error occurred while saving the tag.');
        }
    });

    const onSubmit = (data: TagFormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{tagToEdit ? 'Edit Tag' : 'New Tag'}</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Box className="space-y-4">
                        <TextField
                            {...register('name', { required: 'Name is required' })}
                            label="Tag Name"
                            fullWidth
                            autoFocus
                        />

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
                    </Box>
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

export default TagDialog;
