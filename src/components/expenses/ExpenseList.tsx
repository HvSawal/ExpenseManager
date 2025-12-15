import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Typography,
    Box,
    Card,
    CardContent,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { Edit, Delete, CalendarToday, AccountBalanceWallet } from '@mui/icons-material';
import { format } from 'date-fns';
import type { Expense } from '../../types';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

interface ExpenseListProps {
    expenses: Expense[];
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEdit, onDelete }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleDelete = (id: string) => {
        confirmAlert({
            title: 'Confirm to delete',
            message: 'Are you sure you want to delete this expense?',
            buttons: [
                {
                    label: 'Yes',
                    onClick: () => onDelete(id)
                },
                {
                    label: 'No',
                    onClick: () => { }
                }
            ]
        });
    };

    if (expenses.length === 0) {
        return (
            <Box className="text-center py-10 text-gray-500">
                <Typography variant="h6">No expenses found</Typography>
                <Typography variant="body2">Start by adding a new expense</Typography>
            </Box>
        );
    }

    if (isMobile) {
        return (
            <Box className="space-y-3">
                {expenses.map((expense) => (
                    <Card key={expense.id} className="shadow-sm border border-border bg-background-paper">
                        <CardContent className="p-3">
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold" className="text-text-primary" lineHeight={1.2}>
                                        {expense.description}
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5} color="text.secondary">
                                        <CalendarToday sx={{ fontSize: 12 }} />
                                        <Typography variant="caption" fontSize={12}>
                                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                                        </Typography>
                                        {expense.status === 'pending' && (
                                            <Chip
                                                label="Pending"
                                                size="small"
                                                color="warning"
                                                variant="outlined"
                                                sx={{ height: 16, fontSize: '0.625rem', ml: 1 }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                                <Typography variant="subtitle1" color="primary" fontWeight="bold">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency || 'USD' }).format(expense.amount)}
                                </Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" alignItems="flex-end" mt={1}>
                                <Box display="flex" flexWrap="wrap" gap={0.5} flex={1}>
                                    {expense.category && (
                                        <Chip
                                            label={expense.category.name}
                                            size="small"
                                            sx={{ height: 24, fontSize: '0.75rem', backgroundColor: expense.category.color + '20', color: expense.category.color }}
                                        />
                                    )}
                                    {expense.wallet && (
                                        <Chip
                                            icon={<AccountBalanceWallet sx={{ fontSize: 12 }} />}
                                            label={expense.wallet.name}
                                            size="small"
                                            variant="outlined"
                                            sx={{ height: 24, fontSize: '0.75rem' }}
                                        />
                                    )}
                                    {expense.tags?.map((tag) => (
                                        <Chip key={tag.id} label={tag.name} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.75rem' }} />
                                    ))}
                                </Box>

                                <Box display="flex" gap={0.5} ml={1}>
                                    <IconButton size="small" onClick={() => onEdit(expense)} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 p-1">
                                        <Edit sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleDelete(expense.id)} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-1">
                                        <Delete sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} className="shadow-sm border border-gray-100 dark:border-gray-700 dark:bg-gray-800">
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Wallet</TableCell>
                        <TableCell>Tags</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {expenses.map((expense) => (
                        <TableRow key={expense.id} hover sx={{ opacity: expense.status === 'pending' ? 0.7 : 1 }}>
                            <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                    {expense.description}
                                    {expense.status === 'pending' && (
                                        <Chip
                                            label="Pending"
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.625rem' }}
                                        />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell>
                                {expense.category && (
                                    <Chip
                                        label={expense.category.name}
                                        size="small"
                                        style={{ backgroundColor: expense.category.color + '20', color: expense.category.color }}
                                    />
                                )}
                            </TableCell>
                            <TableCell>{expense.wallet?.name}</TableCell>
                            <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                    {expense.tags?.map((tag) => (
                                        <Chip key={tag.id} label={tag.name} size="small" variant="outlined" />
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell align="right" className="font-medium">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency || 'USD' }).format(expense.amount)}
                            </TableCell>
                            <TableCell align="right">
                                <IconButton size="small" onClick={() => onEdit(expense)} color="primary">
                                    <Edit fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleDelete(expense.id)} color="error">
                                    <Delete fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ExpenseList;
