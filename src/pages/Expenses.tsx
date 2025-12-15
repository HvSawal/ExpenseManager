import { useState } from 'react';
import { Box, Button, Typography, Tabs, Tab, Card, CardContent, IconButton, Chip, CircularProgress, Menu, MenuItem } from '@mui/material';
import { Add, Edit, Delete, Repeat, Download } from '@mui/icons-material';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseForm from '../components/expenses/ExpenseForm';
import RecurringExpenseDialog from '../components/expenses/RecurringExpenseDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExpenses, deleteExpense } from '../api/expenses';
import { getRecurringExpenses, deleteRecurringExpense } from '../api/recurring';
import type { Expense, RecurringExpense } from '../types';
import toast from 'react-hot-toast';
import { exportToCSV, exportToPDF } from '../utils/export';

const Expenses = () => {
    const [tabValue, setTabValue] = useState(0);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
    const [recurringRuleToEdit, setRecurringRuleToEdit] = useState<RecurringExpense | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const queryClient = useQueryClient();

    const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
        queryKey: ['expenses'],
        queryFn: getExpenses,
    });

    const { data: recurringRules = [] } = useQuery({
        queryKey: ['recurring-expenses'],
        queryFn: getRecurringExpenses
    });

    const deleteExpenseMutation = useMutation({
        mutationFn: deleteExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast.success('Expense deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete expense');
        }
    });

    const deleteRecurringMutation = useMutation({
        mutationFn: deleteRecurringExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
            toast.success('Recurring rule deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete recurring rule');
        }
    });

    const handleAddClick = () => {
        if (tabValue === 2) {
            setRecurringRuleToEdit(null);
            setIsRecurringDialogOpen(true);
        } else {
            setExpenseToEdit(null);
            setIsExpenseDialogOpen(true);
        }
    };

    const handleEditExpense = (expense: Expense) => {
        setExpenseToEdit(expense);
        setIsExpenseDialogOpen(true);
    };

    const handleDeleteExpense = (id: string) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            deleteExpenseMutation.mutate(id);
        }
    };

    const handleEditRecurring = (rule: RecurringExpense) => {
        setRecurringRuleToEdit(rule);
        setIsRecurringDialogOpen(true);
    };

    const handleDeleteRecurring = (id: string) => {
        if (window.confirm('Delete this recurring rule? Future expenses will not be generated.')) {
            deleteRecurringMutation.mutate(id);
        }
    };

    const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleExportClose = () => {
        setAnchorEl(null);
    };

    const handleExportCSV = () => {
        exportToCSV(expenses, 'expenses_export');
        handleExportClose();
    };

    const handleExportPDF = () => {
        exportToPDF(expenses, 'Expenses Report');
        handleExportClose();
    };

    if (isLoadingExpenses && tabValue === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    const completedExpenses = expenses.filter(e => e.status !== 'pending');
    const pendingExpenses = expenses
        .filter(e => e.status === 'pending')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <Box>
            <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                gap={2}
                mb={4}
            >
                <Typography variant="h4" fontWeight="bold">
                    {tabValue === 0 ? 'History' : tabValue === 1 ? 'Scheduled' : 'Recurring Rules'}
                </Typography>
                <Box display="flex" gap={2} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                    {tabValue !== 2 && (
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<Download />}
                                onClick={handleExportClick}
                                fullWidth={false}
                            >
                                Export
                            </Button>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleExportClose}
                            >
                                <MenuItem onClick={handleExportCSV}>Export to CSV</MenuItem>
                                <MenuItem onClick={handleExportPDF}>Export to PDF</MenuItem>
                            </Menu>
                        </>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAddClick}
                        fullWidth={false}
                    >
                        Add {tabValue === 2 ? 'Rule' : 'Transaction'}
                    </Button>
                </Box>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} indicatorColor="primary" textColor="primary">
                    <Tab label="History" />
                    <Tab label="Scheduled" />
                    <Tab label="Recurring Rules" />
                </Tabs>
            </Box>

            {tabValue === 0 && (
                <ExpenseList
                    expenses={completedExpenses}
                    onEdit={handleEditExpense}
                    onDelete={handleDeleteExpense}
                />
            )}

            {tabValue === 1 && (
                <ExpenseList
                    expenses={pendingExpenses}
                    onEdit={handleEditExpense}
                    onDelete={handleDeleteExpense}
                />
            )}

            {tabValue === 2 && (
                <Box className="space-y-4">
                    {recurringRules.length === 0 && (
                        <Typography color="text.secondary" textAlign="center" py={4}>
                            No recurring rules found. Create one to automate your bills!
                        </Typography>
                    )}
                    {recurringRules.map((rule) => (
                        <Card key={rule.id}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <Typography variant="h6">{rule.description}</Typography>
                                            <Chip
                                                label={`${rule.interval === 1 ? '' : rule.interval + ' '}${rule.frequency}`}
                                                size="small"
                                                color="info"
                                                variant="outlined"
                                                icon={<Repeat />}
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Amount: ${rule.amount} • Next Due: {new Date(rule.last_processed || rule.start_date).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <IconButton onClick={() => handleEditRecurring(rule)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => handleDeleteRecurring(rule.id)}>
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            <ExpenseForm
                open={isExpenseDialogOpen}
                onClose={() => setIsExpenseDialogOpen(false)}
                expenseToEdit={expenseToEdit}
            />

            <RecurringExpenseDialog
                open={isRecurringDialogOpen}
                onClose={() => setIsRecurringDialogOpen(false)}
                ruleToEdit={recurringRuleToEdit}
            />
        </Box>
    );
};

export default Expenses;
