import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Grid,
    Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories } from '../../api/categories';
import { getWallets } from '../../api/wallets';
import { createRecurringExpense, updateRecurringExpense } from '../../api/recurring';
import toast from 'react-hot-toast';
import type { RecurringExpense } from '../../types';

interface RecurringExpenseDialogProps {
    open: boolean;
    onClose: () => void;
    ruleToEdit?: RecurringExpense | null;
}

import { useUI } from '../../contexts/UIContext';

const RecurringExpenseDialog: React.FC<RecurringExpenseDialogProps> = ({ open, onClose, ruleToEdit }) => {
    const queryClient = useQueryClient();
    const { showError } = useUI();
    const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
    const { data: wallets = [] } = useQuery({ queryKey: ['wallets'], queryFn: getWallets });

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            amount: 0,
            description: '',
            frequency: 'monthly',
            interval: 1,
            start_date: new Date(),
            end_date: null as Date | null,
            category_id: '',
            wallet_id: ''
        }
    });

    useEffect(() => {
        if (ruleToEdit) {
            reset({
                amount: ruleToEdit.amount,
                description: ruleToEdit.description,
                frequency: ruleToEdit.frequency,
                interval: ruleToEdit.interval,
                start_date: new Date(ruleToEdit.start_date),
                end_date: ruleToEdit.end_date ? new Date(ruleToEdit.end_date) : null,
                category_id: ruleToEdit.category_id || '',
                wallet_id: ruleToEdit.wallet_id || ''
            });
        } else {
            reset({
                amount: 0,
                description: '',
                frequency: 'monthly',
                interval: 1,
                start_date: new Date(),
                end_date: null,
                category_id: '',
                wallet_id: ''
            });
        }
    }, [ruleToEdit, reset, open]);

    const mutation = useMutation({
        mutationFn: (data: any) => {
            const payload = {
                ...data,
                start_date: data.start_date.toISOString(),
                end_date: data.end_date ? data.end_date.toISOString() : null
            };

            if (ruleToEdit) {
                return updateRecurringExpense(ruleToEdit.id, payload);
            }
            return createRecurringExpense(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
            toast.success(`Recurring rule ${ruleToEdit ? 'updated' : 'created'} successfully`);
            onClose();
        },
        onError: (error: any) => {
            showError('Failed to Save Rule', error.message || 'An unexpected error occurred while saving the recurring rule.');
        }
    });

    const onSubmit = (data: any) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{ruleToEdit ? 'Edit Recurring Rule' : 'New Recurring Rule'}</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Controller
                            name="description"
                            control={control}
                            rules={{ required: 'Description is required' }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="Description"
                                    fullWidth
                                    margin="normal"
                                    error={!!error}
                                    helperText={error?.message}
                                />
                            )}
                        />

                        <Controller
                            name="amount"
                            control={control}
                            rules={{ required: 'Amount is required', min: 0.01 }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="Amount"
                                    type="number"
                                    fullWidth
                                    margin="normal"
                                    error={!!error}
                                    helperText={error?.message}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                            )}
                        />

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <Controller
                                    name="frequency"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth margin="normal">
                                            <InputLabel>Frequency</InputLabel>
                                            <Select {...field} label="Frequency">
                                                <MenuItem value="daily">Daily</MenuItem>
                                                <MenuItem value="weekly">Weekly</MenuItem>
                                                <MenuItem value="monthly">Monthly</MenuItem>
                                                <MenuItem value="yearly">Yearly</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Controller
                                    name="interval"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Interval (e.g. every 2 months)"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>

                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <Controller
                                        name="start_date"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePicker
                                                label="Start Date"
                                                value={field.value}
                                                onChange={field.onChange}
                                                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Controller
                                        name="end_date"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePicker
                                                label="End Date (Optional)"
                                                value={field.value}
                                                onChange={field.onChange}
                                                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </LocalizationProvider>

                        <Controller
                            name="category_id"
                            control={control}
                            rules={{ required: 'Category is required' }}
                            render={({ field, fieldState: { error } }) => (
                                <FormControl fullWidth margin="normal" error={!!error}>
                                    <InputLabel>Category</InputLabel>
                                    <Select {...field} label="Category">
                                        {categories.map((cat) => (
                                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />

                        <Controller
                            name="wallet_id"
                            control={control}
                            rules={{ required: 'Wallet is required' }}
                            render={({ field, fieldState: { error } }) => (
                                <FormControl fullWidth margin="normal" error={!!error}>
                                    <InputLabel>Wallet</InputLabel>
                                    <Select {...field} label="Wallet">
                                        {wallets.map((wallet) => (
                                            <MenuItem key={wallet.id} value={wallet.id}>{wallet.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={mutation.isPending}>
                        {mutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default RecurringExpenseDialog;
