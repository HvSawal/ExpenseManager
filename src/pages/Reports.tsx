import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Grid,
    Paper,
    FormControl,
    Select,
    MenuItem,
    Card,
    CardContent,
    Stack,
    Tabs,
    Tab
} from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isSameMonth, eachDayOfInterval } from 'date-fns';
import { getExpenses, deleteExpense } from '../api/expenses';
import { TrendingUp, TrendingDown, Wallet, PieChart as PieIcon } from 'lucide-react';
import BreakdownReport from '../components/reports/BreakdownReport';
import toast from 'react-hot-toast';
import type { Expense } from '../types';
import ExpenseForm from '../components/expenses/ExpenseForm';
import { getHistoricalRate } from '../api/currency';
import { useUserProfile } from '../contexts/UserProfileContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const Reports = () => {
    const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
    const [activeTab, setActiveTab] = useState(0);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: expenses = [] } = useQuery({
        queryKey: ['expenses'],
        queryFn: getExpenses
    });

    const deleteMutation = useMutation({
        mutationFn: deleteExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast.success('Expense deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete expense');
        }
    });

    const handleEditExpense = (expense: Expense) => {
        setExpenseToEdit(expense);
        setIsFormOpen(true);
    };

    const handleDeleteExpense = (id: string) => {
        deleteMutation.mutate(id);
    };

    const { profile } = useUserProfile();

    // Filter expenses for the selected month
    const monthlyData = useMemo(() => {
        return expenses.filter(e => isSameMonth(parseISO(e.date), selectedMonth));
    }, [expenses, selectedMonth]);

    const [normalizedStats, setNormalizedStats] = useState({
        income: 0,
        expense: 0,
        savings: 0,
        savingsRate: 0
    });

    const [normalizedCategoryData, setNormalizedCategoryData] = useState<any[]>([]);
    const [normalizedSixMonthData, setNormalizedSixMonthData] = useState<any[]>([]);
    const [normalizedDailyTrendData, setNormalizedDailyTrendData] = useState<any[]>([]);

    // Calculate Normalized Stats
    useEffect(() => {
        const calculateStats = async () => {
            let incomeTotal = 0;
            let expenseTotal = 0;

            for (const e of monthlyData) {
                const amount = Number(e.amount);
                const currency = e.currency || profile.currency || 'USD';

                if (currency === profile.currency) {
                    if (e.category?.type === 'income') incomeTotal += amount;
                    else if (e.category?.type === 'expense') expenseTotal += amount;
                } else {
                    try {
                        const rate = await getHistoricalRate(parseISO(e.date), currency, profile.currency);
                        if (e.category?.type === 'income') incomeTotal += amount * rate;
                        else if (e.category?.type === 'expense') expenseTotal += amount * rate;
                    } catch (err) {
                        if (e.category?.type === 'income') incomeTotal += amount;
                        else if (e.category?.type === 'expense') expenseTotal += amount;
                    }
                }
            }

            const savings = incomeTotal - expenseTotal;
            const savingsRate = incomeTotal > 0 ? (savings / incomeTotal) * 100 : 0;

            setNormalizedStats({ income: incomeTotal, expense: expenseTotal, savings, savingsRate });
        };

        if (monthlyData.length > 0) calculateStats();
        else setNormalizedStats({ income: 0, expense: 0, savings: 0, savingsRate: 0 });
    }, [monthlyData, profile.currency]);

    // Calculate Normalized Category Data
    useEffect(() => {
        const calculateCategoryData = async () => {
            const categoryMap = new Map<string, number>();

            const expenseItems = monthlyData.filter(e => e.category?.type === 'expense');

            for (const e of expenseItems) {
                const name = e.category?.name || 'Uncategorized';
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

                const current = categoryMap.get(name) || 0;
                categoryMap.set(name, current + normalizedAmount);
            }

            const data = Array.from(categoryMap.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            setNormalizedCategoryData(data);
        };

        if (monthlyData.length > 0) calculateCategoryData();
        else setNormalizedCategoryData([]);
    }, [monthlyData, profile.currency]);

    // Calculate Six Month Data
    useEffect(() => {
        const calculateSixMonthData = async () => {
            const months = [];
            for (let i = 5; i >= 0; i--) {
                months.push(subMonths(new Date(), i));
            }

            const data = await Promise.all(months.map(async (date) => {
                const monthExpenses = expenses.filter(e => isSameMonth(parseISO(e.date), date));

                let incomeTotal = 0;
                let expenseTotal = 0;

                for (const e of monthExpenses) {
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

                    if (e.category?.type === 'income') incomeTotal += normalizedAmount;
                    else if (e.category?.type === 'expense') expenseTotal += normalizedAmount;
                }

                return {
                    name: format(date, 'MMM'),
                    Income: incomeTotal,
                    Expense: expenseTotal
                };
            }));

            setNormalizedSixMonthData(data);
        };

        if (expenses.length > 0) calculateSixMonthData();
    }, [expenses, profile.currency]);

    // Calculate Daily Trend Data
    useEffect(() => {
        const calculateDailyTrend = async () => {
            const start = startOfMonth(selectedMonth);
            const end = endOfMonth(selectedMonth);
            const days = eachDayOfInterval({ start, end });

            const data = await Promise.all(days.map(async (day) => {
                const dayExpenses = monthlyData.filter(e =>
                    e.category?.type === 'expense' &&
                    format(parseISO(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                );

                let dailyTotal = 0;
                for (const e of dayExpenses) {
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
                    dailyTotal += normalizedAmount;
                }

                return {
                    date: format(day, 'dd'),
                    amount: dailyTotal
                };
            }));

            setNormalizedDailyTrendData(data);
        };

        if (monthlyData.length > 0) calculateDailyTrend();
        else setNormalizedDailyTrendData([]);
    }, [monthlyData, selectedMonth, profile.currency]);

    const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
        <Card sx={{ height: '100%' }} className="shadow-sm border border-gray-100 dark:border-gray-700 bg-background-paper">
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" className="text-text-primary">
                            {value}
                        </Typography>
                    </Box>
                    <Box className={`p-2 rounded-lg ${color} bg-opacity-10`}>
                        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                    </Box>
                </Stack>
                {subtext && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        {subtext}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );

    return (
        <Box className="space-y-6">
            <Box className="flex justify-between items-center">
                <Typography variant="h4" fontWeight="bold" className="text-text-primary">
                    Reports
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                        value={selectedMonth.toISOString()}
                        onChange={(e) => setSelectedMonth(parseISO(e.target.value))}
                        className="bg-background-paper text-text-primary"
                    >
                        {[0, 1, 2, 3, 4, 5].map(i => {
                            const date = subMonths(startOfMonth(new Date()), i);
                            return (
                                <MenuItem key={i} value={date.toISOString()}>
                                    {format(date, 'MMMM yyyy')}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                    <Tab label="Overview" />
                    <Tab label="Breakdown" />
                </Tabs>
            </Box>

            {activeTab === 0 && (
                <Box className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Summary Cards */}
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard
                                title="Total Income"
                                value={new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency }).format(normalizedStats.income)}
                                icon={TrendingUp}
                                color="text-green-500"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard
                                title="Total Expenses"
                                value={new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency }).format(normalizedStats.expense)}
                                icon={TrendingDown}
                                color="text-red-500"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard
                                title="Net Savings"
                                value={new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency }).format(normalizedStats.savings)}
                                icon={Wallet}
                                color="text-indigo-500"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard
                                title="Savings Rate"
                                value={`${normalizedStats.savingsRate.toFixed(1)}%`}
                                icon={PieIcon}
                                color="text-orange-500"
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        {/* Income vs Expense Bar Chart */}
                        <Grid size={{ xs: 12, lg: 8 }}>
                            <Paper className="p-6 h-[400px] shadow-sm border border-gray-100 dark:border-gray-700 bg-background-paper flex flex-col">
                                <Typography variant="h6" gutterBottom className="text-text-primary font-bold">
                                    Income vs Expense (Last 6 Months)
                                </Typography>
                                <div className="flex-1 min-h-0 flex items-center justify-center">
                                    {normalizedSixMonthData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={normalizedSixMonthData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                <YAxis axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'var(--bg-paper)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: 'var(--text-primary)' }}
                                                />
                                                <Legend />
                                                <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <Typography color="text.secondary">No data available</Typography>
                                    )}
                                </div>
                            </Paper>
                        </Grid>

                        {/* Category Pie Chart */}
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <Paper className="p-6 h-[400px] shadow-sm border border-gray-100 dark:border-gray-700 bg-background-paper flex flex-col">
                                <Typography variant="h6" gutterBottom className="text-text-primary font-bold">
                                    Expenses by Category
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
                                                >
                                                    {normalizedCategoryData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-paper)', color: 'var(--text-primary)' }} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <Typography color="text.secondary">No data available</Typography>
                                    )}
                                </div>
                            </Paper>
                        </Grid>

                        {/* Daily Spending Trend */}
                        <Grid size={{ xs: 12 }}>
                            <Paper className="p-6 h-[300px] shadow-sm border border-gray-100 dark:border-gray-700 bg-background-paper flex flex-col">
                                <Typography variant="h6" gutterBottom className="text-text-primary font-bold">
                                    Daily Spending Trend
                                </Typography>
                                <div className="flex-1 min-h-0 flex items-center justify-center">
                                    {normalizedDailyTrendData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={normalizedDailyTrendData}>
                                                <defs>
                                                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                                <YAxis axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'var(--bg-paper)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: 'var(--text-primary)' }}
                                                />
                                                <Area type="monotone" dataKey="amount" stroke="#6366F1" fillOpacity={1} fill="url(#colorTrend)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <Typography color="text.secondary">No data available</Typography>
                                    )}
                                </div>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {activeTab === 1 && (
                <Box className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <BreakdownReport
                        expenses={monthlyData}
                        onEditExpense={handleEditExpense}
                        onDeleteExpense={handleDeleteExpense}
                    />
                </Box>
            )}

            <ExpenseForm
                open={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setExpenseToEdit(null);
                }}
                expenseToEdit={expenseToEdit}
            />
        </Box>
    );
};

export default Reports;
