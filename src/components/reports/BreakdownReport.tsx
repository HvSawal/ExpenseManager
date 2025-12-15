import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Stack,
    Chip,
    Button
} from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { Clear } from '@mui/icons-material';
import type { Expense } from '../../types';
import ExpenseList from '../expenses/ExpenseList';
import { getHistoricalRate } from '../../api/currency';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { parseISO } from 'date-fns';

interface BreakdownReportProps {
    expenses: Expense[];
    onEditExpense: (expense: Expense) => void;
    onDeleteExpense: (id: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const BreakdownReport: React.FC<BreakdownReportProps> = ({ expenses, onEditExpense, onDeleteExpense }) => {
    const { profile } = useUserProfile();
    const [filter, setFilter] = useState<{ type: 'category' | 'tag' | null; id: string | null; name: string | null }>({
        type: null,
        id: null,
        name: null
    });

    const [normalizedCategoryData, setNormalizedCategoryData] = useState<any[]>([]);
    const [normalizedTagData, setNormalizedTagData] = useState<any[]>([]);

    // Calculate Normalized Category Data
    useEffect(() => {
        const calculateCategoryData = async () => {
            const categoryMap = new Map<string, { value: number; id: string }>();
            const expenseItems = expenses.filter(e => e.category?.type === 'expense');

            for (const e of expenseItems) {
                const name = e.category?.name || 'Uncategorized';
                const id = e.category?.id || 'uncategorized';
                const amount = Number(e.amount);
                const currency = e.currency || profile.currency || 'USD';
                let normalizedAmount = amount;

                if (currency !== profile.currency) {
                    try {
                        const rate = await getHistoricalRate(parseISO(e.date), currency, profile.currency);
                        normalizedAmount = amount * rate;
                    } catch (err) {
                        // fallback
                    }
                }

                const current = categoryMap.get(name) || { value: 0, id };
                categoryMap.set(name, { value: current.value + normalizedAmount, id });
            }

            const data = Array.from(categoryMap.entries())
                .map(([name, { value, id }]) => ({ name, value, id }))
                .sort((a, b) => b.value - a.value);

            setNormalizedCategoryData(data);
        };

        if (expenses.length > 0) calculateCategoryData();
        else setNormalizedCategoryData([]);
    }, [expenses, profile.currency]);

    // Calculate Normalized Tag Data
    useEffect(() => {
        const calculateTagData = async () => {
            const tagMap = new Map<string, { value: number; id: string }>();
            const expenseItems = expenses.filter(e => e.category?.type === 'expense');

            for (const e of expenseItems) {
                const amount = Number(e.amount);
                const currency = e.currency || profile.currency || 'USD';
                let normalizedAmount = amount;

                if (currency !== profile.currency) {
                    try {
                        const rate = await getHistoricalRate(parseISO(e.date), currency, profile.currency);
                        normalizedAmount = amount * rate;
                    } catch (err) {
                        // fallback
                    }
                }

                if (e.tags && e.tags.length > 0) {
                    e.tags.forEach(tag => {
                        const current = tagMap.get(tag.name) || { value: 0, id: tag.id };
                        // Split amount across tags? Or full amount? Keeping full amount per tag as per original logic.
                        tagMap.set(tag.name, { value: current.value + normalizedAmount, id: tag.id });
                    });
                } else {
                    const name = 'No Tags';
                    const id = 'no-tags';
                    const current = tagMap.get(name) || { value: 0, id };
                    tagMap.set(name, { value: current.value + normalizedAmount, id });
                }
            }

            const data = Array.from(tagMap.entries())
                .map(([name, { value, id }]) => ({ name, value, id }))
                .sort((a, b) => b.value - a.value);

            setNormalizedTagData(data);
        };

        if (expenses.length > 0) calculateTagData();
        else setNormalizedTagData([]);
    }, [expenses, profile.currency]);

    // Filtered Expenses
    const filteredExpenses = useMemo(() => {
        if (!filter.type || !filter.id) return expenses;

        return expenses.filter(e => {
            if (filter.type === 'category') {
                if (filter.id === 'uncategorized') return !e.category;
                return e.category?.id === filter.id;
            } else if (filter.type === 'tag') {
                if (filter.id === 'no-tags') return !e.tags || e.tags.length === 0;
                return e.tags?.some(t => t.id === filter.id);
            }
            return true;
        });
    }, [expenses, filter]);

    const handlePieClick = (data: any, type: 'category' | 'tag') => {
        if (data && data.id) {
            setFilter({ type, id: data.id, name: data.name });
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency }).format(value);
    };

    return (
        <Box className="space-y-6">
            <Grid container spacing={3}>
                {/* Category Pie Chart */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper className="p-6 h-[400px] shadow-sm border border-gray-100 dark:border-gray-700 dark:bg-gray-800 flex flex-col">
                        <Typography variant="h6" gutterBottom className="dark:text-white font-bold">
                            Expenses by Category
                        </Typography>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                            Click a slice to filter details
                        </Typography>
                        <div className="flex-1 min-h-0 flex items-center justify-center">
                            {normalizedCategoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={normalizedCategoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            onClick={(data) => handlePieClick(data.payload, 'category')}
                                            cursor="pointer"
                                        >
                                            {normalizedCategoryData.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    stroke={filter.type === 'category' && filter.id === normalizedCategoryData[index].id ? '#000' : 'none'}
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Typography color="text.secondary">No data available</Typography>
                            )}
                        </div>
                    </Paper>
                </Grid>

                {/* Tag Pie Chart */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper className="p-6 h-[400px] shadow-sm border border-gray-100 dark:border-gray-700 dark:bg-gray-800 flex flex-col">
                        <Typography variant="h6" gutterBottom className="dark:text-white font-bold">
                            Expenses by Tags
                        </Typography>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                            Click a slice to filter details
                        </Typography>
                        <div className="flex-1 min-h-0 flex items-center justify-center">
                            {normalizedTagData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={normalizedTagData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            onClick={(data) => handlePieClick(data.payload, 'tag')}
                                            cursor="pointer"
                                        >
                                            {normalizedTagData.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    stroke={filter.type === 'tag' && filter.id === normalizedTagData[index].id ? '#000' : 'none'}
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Typography color="text.secondary">No data available</Typography>
                            )}
                        </div>
                    </Paper>
                </Grid>
            </Grid>


            {/* Filtered List Section */}
            <Paper className="p-6 shadow-sm border border-gray-100 dark:border-gray-700 dark:bg-gray-800">
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="h6" className="dark:text-white font-bold">
                            {filter.type ? `${filter.name} Expenses` : 'All Expenses'}
                        </Typography>
                        {filter.type && (
                            <Chip
                                label={`Filtered by ${filter.type}: ${filter.name}`}
                                onDelete={() => setFilter({ type: null, id: null, name: null })}
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Stack>
                    {filter.type && (
                        <Button
                            startIcon={<Clear />}
                            onClick={() => setFilter({ type: null, id: null, name: null })}
                            size="small"
                        >
                            Clear Filter
                        </Button>
                    )}
                </Stack>

                <ExpenseList
                    expenses={filteredExpenses}
                    onEdit={onEditExpense}
                    onDelete={onDeleteExpense}
                />
            </Paper>
        </Box>
    );
};

export default BreakdownReport;
