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
    InputAdornment,
    Stack
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWallet, updateWallet } from '../../api/wallets';
import type { Wallet } from '../../types';
import toast from 'react-hot-toast';

interface WalletDialogProps {
    open: boolean;
    onClose: () => void;
    walletToEdit?: Wallet | null;
}

interface WalletFormData {
    name: string;
    type: 'cash' | 'bank' | 'credit_card' | 'digital_wallet';
    currency: string;
    balance: number;
    color: string;
    icon: string;
}

const ICONS = ['💵', '🏦', '💳', '📱', '💰', '🪙'];
const COLORS = ['#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#6B7280'];
const CURRENCIES = [
    { code: 'USD', symbol: '$', label: 'USD ($)' },
    { code: 'EUR', symbol: '€', label: 'EUR (€)' },
    { code: 'GBP', symbol: '£', label: 'GBP (£)' },
    { code: 'INR', symbol: '₹', label: 'INR (₹)' },
    { code: 'JPY', symbol: '¥', label: 'JPY (¥)' }
];

import { useUI } from '../../contexts/UIContext';

const WalletDialog = ({ open, onClose, walletToEdit }: WalletDialogProps) => {
    const queryClient = useQueryClient();
    const { showError } = useUI();
    const { register, handleSubmit, reset, setValue, watch } = useForm<WalletFormData>({
        defaultValues: {
            name: '',
            type: 'cash',
            currency: 'USD',
            balance: 0,
            color: COLORS[0],
            icon: ICONS[0]
        }
    });

    const selectedColor = watch('color');
    const selectedIcon = watch('icon');
    const selectedCurrency = watch('currency');

    const currencySymbol = CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '$';

    useEffect(() => {
        if (walletToEdit) {
            reset({
                name: walletToEdit.name,
                type: walletToEdit.type,
                currency: walletToEdit.currency,
                balance: walletToEdit.balance,
                color: walletToEdit.color,
                icon: walletToEdit.icon
            });
        } else {
            reset({
                name: '',
                type: 'cash',
                currency: 'USD',
                balance: 0,
                color: COLORS[0],
                icon: ICONS[0]
            });
        }
    }, [walletToEdit, reset, open]);

    const mutation = useMutation({
        mutationFn: (data: WalletFormData) => {
            if (walletToEdit) {
                return updateWallet(walletToEdit.id, data);
            }
            return createWallet(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            toast.success(`Wallet ${walletToEdit ? 'updated' : 'created'} successfully`);
            onClose();
        },
        onError: (error: any) => {
            showError('Failed to Save Wallet', error.message || 'An unexpected error occurred while saving the wallet.');
        }
    });

    const onSubmit = (data: WalletFormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{walletToEdit ? 'Edit Wallet' : 'New Wallet'}</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            {...register('name', { required: 'Name is required' })}
                            label="Wallet Name"
                            fullWidth
                            autoFocus
                        />

                        <TextField
                            {...register('type')}
                            select
                            label="Type"
                            fullWidth
                        >
                            <MenuItem value="cash">Cash</MenuItem>
                            <MenuItem value="bank">Bank Account</MenuItem>
                            <MenuItem value="credit_card">Credit Card</MenuItem>
                            <MenuItem value="digital_wallet">Digital Wallet</MenuItem>
                        </TextField>

                        <TextField
                            {...register('currency')}
                            select
                            label="Currency"
                            fullWidth
                            defaultValue="USD"
                        >
                            {CURRENCIES.map((option) => (
                                <MenuItem key={option.code} value={option.code}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            {...register('balance', { valueAsNumber: true })}
                            label="Initial Balance"
                            type="number"
                            fullWidth
                            InputProps={{
                                startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                            }}
                        />

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

export default WalletDialog;
