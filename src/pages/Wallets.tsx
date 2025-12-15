import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Button,
    Typography,
    Card,
    CardContent,
    IconButton,
    Grid,
    CircularProgress,
    Chip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { getWallets, deleteWallet } from '../api/wallets';
import WalletDialog from '../components/wallets/WalletDialog';
import type { Wallet } from '../types';
import toast from 'react-hot-toast';

const Wallets = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);
    const queryClient = useQueryClient();

    const { data: wallets = [], isLoading } = useQuery({
        queryKey: ['wallets'],
        queryFn: getWallets,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteWallet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            toast.success('Wallet deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete wallet');
        }
    });

    const handleAddClick = () => {
        setWalletToEdit(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (wallet: Wallet) => {
        setWalletToEdit(wallet);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        if (window.confirm('Are you sure you want to delete this wallet?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold" className="text-text-primary">
                    Wallets
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddClick}
                >
                    Add Wallet
                </Button>
            </Box>

            <Grid container spacing={3}>
                {wallets.map((wallet) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={wallet.id}>
                        <Card className="bg-background-paper">
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem',
                                                backgroundColor: `${wallet.color}20`,
                                                color: wallet.color
                                            }}
                                        >
                                            {wallet.icon}
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" className="text-text-primary">
                                                {wallet.name}
                                            </Typography>
                                            <Box display="flex" gap={1} alignItems="center">
                                                <Chip
                                                    label={wallet.type.replace('_', ' ')}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ textTransform: 'capitalize' }}
                                                />
                                                <Typography variant="body2" className="text-text-secondary">
                                                    {wallet.currency}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditClick(wallet)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteClick(wallet.id)}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                                <Box mt={2}>
                                    <Typography variant="h5" fontWeight="bold" className="text-text-primary">
                                        ${wallet.balance.toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" className="text-text-secondary">
                                        Current Balance
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {wallets.length === 0 && (
                <Box textAlign="center" py={8} color="text.secondary">
                    <Typography>No wallets found. Create one to get started!</Typography>
                </Box>
            )}

            <WalletDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                walletToEdit={walletToEdit}
            />
        </Box>
    );
};

export default Wallets;
