import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
    Chip,
    Autocomplete,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Switch,
    FormControlLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories } from '../../api/categories';
import { getWallets } from '../../api/wallets';
import { getTags } from '../../api/tags';
import { getGroups } from '../../api/groups';
import { createExpense, updateExpense } from '../../api/expenses';
import toast from 'react-hot-toast';
import type { Expense, ExpenseFormData, Group } from '../../types';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { useUI } from '../../contexts/UIContext';

const expenseSchema = z.object({
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    description: z.string().min(1, 'Description is required'),
    date: z.date(),
    category_id: z.string().min(1, 'Category is required'),
    wallet_id: z.string().min(1, 'Wallet is required'),
    tag_ids: z.array(z.string()),
    group_id: z.string().optional(),
    currency: z.string().min(1, 'Currency is required'),
});

type ExpenseFormInputs = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
    open: boolean;
    onClose: () => void;
    expenseToEdit?: Expense | null;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ open, onClose, expenseToEdit }) => {
    const queryClient = useQueryClient();
    const { profile } = useUserProfile();
    const { showError } = useUI();
    const [transactionType, setTransactionType] = React.useState<'expense' | 'income'>('expense');
    const [isRecurring, setIsRecurring] = React.useState(false);
    const [recurrenceType, setRecurrenceType] = React.useState('monthly');
    const [recurrenceEndDate, setRecurrenceEndDate] = React.useState<Date | null>(null);

    const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
    const { data: wallets = [] } = useQuery({ queryKey: ['wallets'], queryFn: getWallets });
    const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: getTags });
    const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups });

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ExpenseFormInputs>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            amount: 0,
            description: '',
            date: new Date(),
            category_id: '',
            wallet_id: '',
            tag_ids: [],
            group_id: '',
            currency: profile.currency || 'USD',
        },
    });

    useEffect(() => {
        if (expenseToEdit) {
            // Determine type based on category
            if (expenseToEdit.category?.type) {
                setTransactionType(expenseToEdit.category.type);
            }

            reset({
                amount: expenseToEdit.amount,
                description: expenseToEdit.description,
                date: new Date(expenseToEdit.date),
                category_id: expenseToEdit.category_id || '',
                wallet_id: expenseToEdit.wallet_id || '',
                tag_ids: expenseToEdit.tags?.map(t => t.id) || [],
                group_id: expenseToEdit.group_id || '',
                currency: expenseToEdit.currency || profile.currency || 'USD',
            });
            setIsRecurring(false); // Reset recurrence for edit mode for now
            setRecurrenceType('monthly');
            setRecurrenceEndDate(null);
        } else {
            setTransactionType('expense');
            reset({
                amount: 0,
                description: '',
                date: new Date(),
                category_id: '',
                wallet_id: '',
                tag_ids: [],
                group_id: '',
                currency: profile.currency || 'USD',
            });
            setIsRecurring(false);
            setRecurrenceType('monthly');
            setRecurrenceEndDate(null);
        }
    }, [expenseToEdit, reset, open, profile.currency]);

    const createMutation = useMutation({
        mutationFn: createExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast.success('Transaction added successfully');
            onClose();
        },
        onError: (error: any) => {
            showError('Failed to Add Transaction', error.message || 'An unexpected error occurred while adding the transaction.');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: ExpenseFormInputs) => updateExpense(expenseToEdit!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast.success('Transaction updated successfully');
            onClose();
        },
        onError: (error: any) => {
            showError('Failed to Update Transaction', error.message || 'An unexpected error occurred while updating the transaction.');
        },
    });

    const onSubmit = (data: ExpenseFormInputs) => {
        // If group_id is empty string, make it undefined
        const cleanData: ExpenseFormData = {
            ...data,
            group_id: data.group_id || undefined
        };

        if (isRecurring && !expenseToEdit) {
            let frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly';
            let interval = 1;

            switch (recurrenceType) {
                case 'daily': frequency = 'daily'; interval = 1; break;
                case 'weekly': frequency = 'weekly'; interval = 1; break;
                case 'biweekly': frequency = 'weekly'; interval = 2; break;
                case 'monthly': frequency = 'monthly'; interval = 1; break;
                case 'quarterly': frequency = 'monthly'; interval = 3; break;
                case 'semiannual': frequency = 'monthly'; interval = 6; break;
                case 'yearly': frequency = 'yearly'; interval = 1; break;
            }

            cleanData.recurrence = {
                frequency,
                interval,
                end_date: recurrenceEndDate || undefined
            };
        }

        if (expenseToEdit) {
            updateMutation.mutate(cleanData);
        } else {
            createMutation.mutate(cleanData);
        }
    };

    const handleTypeChange = (
        _: React.MouseEvent<HTMLElement>,
        newType: 'expense' | 'income' | null,
    ) => {
        if (newType !== null) {
            setTransactionType(newType);
            setValue('category_id', ''); // Reset category when type changes
        }
    };

    const filteredCategories = categories.filter(c => c.type === transactionType);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{expenseToEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <ToggleButtonGroup
                            value={transactionType}
                            exclusive
                            onChange={handleTypeChange}
                            fullWidth
                            color="primary"
                        >
                            <ToggleButton value="expense" color="error">
                                Expense
                            </ToggleButton>
                            <ToggleButton value="income" color="success">
                                Income
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <Controller
                            name="group_id"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel>Group (Optional)</InputLabel>
                                    <Select {...field} label="Group (Optional)">
                                        <MenuItem value="">
                                            <em>None (Personal)</em>
                                        </MenuItem>
                                        {groups.map((group: Group) => (
                                            <MenuItem key={group.id} value={group.id}>
                                                {group.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />

                        <div className="flex gap-4">
                            <Controller
                                name="currency"
                                control={control}
                                render={({ field }) => (
                                    <FormControl sx={{ minWidth: 100 }}>
                                        <InputLabel>Currency</InputLabel>
                                        <Select {...field} label="Currency">
                                            <MenuItem value="USD">USD ($)</MenuItem>
                                            <MenuItem value="EUR">EUR (€)</MenuItem>
                                            <MenuItem value="GBP">GBP (£)</MenuItem>
                                            <MenuItem value="INR">INR (₹)</MenuItem>
                                            <MenuItem value="JPY">JPY (¥)</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />
                            <Controller
                                name="amount"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Amount"
                                        type="number"
                                        fullWidth
                                        error={!!errors.amount}
                                        helperText={errors.amount?.message}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            field.onChange(value === '' ? 0 : parseFloat(value));
                                        }}
                                    />
                                )}
                            />
                        </div>

                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Description"
                                    fullWidth
                                    error={!!errors.description}
                                    helperText={errors.description?.message}
                                />
                            )}
                        />

                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker
                                        label="Date"
                                        value={field.value}
                                        onChange={field.onChange}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                error: !!errors.date,
                                                helperText: errors.date?.message,
                                            },
                                        }}
                                    />
                                )}
                            />
                        </LocalizationProvider>

                        {!expenseToEdit && (
                            <Stack spacing={2}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                        />
                                    }
                                    label="Recurring Transaction"
                                />

                                {isRecurring && (
                                    <div className="flex gap-4 animate-in fade-in slide-in-from-top-2">
                                        <FormControl fullWidth>
                                            <InputLabel>Frequency</InputLabel>
                                            <Select
                                                value={recurrenceType}
                                                label="Frequency"
                                                onChange={(e) => setRecurrenceType(e.target.value)}
                                            >
                                                <MenuItem value="daily">Daily</MenuItem>
                                                <MenuItem value="weekly">Weekly</MenuItem>
                                                <MenuItem value="biweekly">Bi-weekly</MenuItem>
                                                <MenuItem value="monthly">Monthly</MenuItem>
                                                <MenuItem value="quarterly">Quarterly</MenuItem>
                                                <MenuItem value="semiannual">Semi-Annually</MenuItem>
                                                <MenuItem value="yearly">Annually</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DatePicker
                                                label="End Date (Optional)"
                                                value={recurrenceEndDate}
                                                onChange={setRecurrenceEndDate}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        helperText: recurrenceEndDate ? '' : 'Defaults to 1 year',
                                                    },
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </div>
                                )}
                            </Stack>
                        )}

                        <Controller
                            name="category_id"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth error={!!errors.category_id}>
                                    <InputLabel>Category</InputLabel>
                                    <Select {...field} label="Category">
                                        {filteredCategories.map((category) => (
                                            <MenuItem key={category.id} value={category.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{category.icon}</span>
                                                    <span>{category.name}</span>
                                                </div>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />

                        <Controller
                            name="wallet_id"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth error={!!errors.wallet_id}>
                                    <InputLabel>Wallet</InputLabel>
                                    <Select {...field} label="Wallet">
                                        {wallets.map((wallet) => (
                                            <MenuItem key={wallet.id} value={wallet.id}>
                                                {wallet.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />

                        <Controller
                            name="tag_ids"
                            control={control}
                            render={({ field }) => (
                                <Autocomplete
                                    multiple
                                    options={tags}
                                    getOptionLabel={(option) => option.name}
                                    value={tags.filter(tag => field.value.includes(tag.id))}
                                    onChange={(_, newValue) => {
                                        field.onChange(newValue.map(tag => tag.id));
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Tags"
                                            placeholder="Select tags"
                                        />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                label={option.name}
                                                {...getTagProps({ index })}
                                                key={option.id}
                                                sx={{ backgroundColor: option.color, color: '#fff' }}
                                            />
                                        ))
                                    }
                                />
                            )}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                        {expenseToEdit ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ExpenseForm;
