import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
    TrendingUp,
    TrendingDown,
    Wallet,
    CreditCard,
    DollarSign
} from 'lucide-react';
import { Card, CardContent, Typography } from '@mui/material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { processRecurringExpenses } from '../api/recurring';
import { getExpenses } from '../api/expenses';
import { getWallets } from '../api/wallets';
import { getHistoricalRate } from '../api/currency';
import toast from 'react-hot-toast';
import { format, isSameMonth, subDays } from 'date-fns';

import { useUserProfile } from '../contexts/UserProfileContext';

const StatCard = ({ title, amounts, icon: Icon, color, trend, trendLabel }: any) => (
    <Card className="bg-background-paper h-full">
        <CardContent>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-text-secondary">{title}</p>
                    <div className="mt-2">
                        {Object.entries(amounts).length === 0 ? (
                            <h3 className="text-2xl font-bold text-text-primary">0.00</h3>
                        ) : (
                            Object.entries(amounts).map(([currency, amount]: [string, any]) => (
                                <h3 key={currency} className="text-2xl font-bold text-text-primary">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}
                                </h3>
                            ))
                        )}
                    </div>
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
            {trend !== undefined && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={`font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend >= 0 ? '+' : ''}{trend}%
                    </span>
                    <span className="text-text-secondary ml-2">{trendLabel || 'from last month'}</span>
                </div>
            )}
        </CardContent>
    </Card>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { profile } = useUserProfile();

    const { data: expenses = [] } = useQuery({
        queryKey: ['expenses'],
        queryFn: getExpenses
    });

    const { data: wallets = [] } = useQuery({
        queryKey: ['wallets'],
        queryFn: getWallets
    });

    useEffect(() => {
        const checkRecurring = async () => {
            try {
                const count = await processRecurringExpenses();
                if (count && count > 0) {
                    toast.success(`Generated ${count} recurring expense(s)`);
                    queryClient.invalidateQueries({ queryKey: ['expenses'] });
                }
            } catch (error) {
                console.error('Failed to process recurring expenses', error);
            }
        };
        checkRecurring();
    }, [queryClient]);

    const [normalizedStats, setNormalizedStats] = useState({
        totalExpenses: 0,
        totalIncome: 0,
        totalBalance: 0,
        netSavings: 0
    });

    useEffect(() => {
        const calculateStats = async () => {
            const now = new Date();
            const currentMonthExpenses = expenses.filter(e => isSameMonth(new Date(e.date), now));

            let expenseTotal = 0;
            let incomeTotal = 0;

            // Calculate Expenses & Income
            for (const item of currentMonthExpenses) {
                const amount = Number(item.amount);
                const currency = item.currency || profile.currency || 'USD';

                if (currency === profile.currency) {
                    if (item.category?.type === 'income') incomeTotal += amount;
                    else expenseTotal += amount;
                } else {
                    try {
                        const rate = await getHistoricalRate(new Date(item.date), currency, profile.currency);
                        if (item.category?.type === 'income') incomeTotal += amount * rate;
                        else expenseTotal += amount * rate;
                    } catch (e) {
                        console.error('Conversion failed', e);
                        // Fallback to adding raw amount or 0? Adding raw might be misleading.
                        // Let's add raw for now but maybe warn?
                        if (item.category?.type === 'income') incomeTotal += amount;
                        else expenseTotal += amount;
                    }
                }
            }

            // Calculate Balance (Wallets)
            // Note: Wallets don't have a date history easily accessible here, so we use latest rate or today's rate.
            // Ideally wallets should have a 'last_updated' or we just use today.
            let balanceTotal = 0;
            for (const wallet of wallets) {
                const amount = Number(wallet.balance);
                const currency = wallet.currency || profile.currency || 'USD';

                if (currency === profile.currency) {
                    balanceTotal += amount;
                } else {
                    try {
                        // Use today's rate for current balance
                        const rate = await getHistoricalRate(new Date(), currency, profile.currency);
                        balanceTotal += amount * rate;
                    } catch (e) {
                        balanceTotal += amount;
                    }
                }
            }

            setNormalizedStats({
                totalExpenses: expenseTotal,
                totalIncome: incomeTotal,
                totalBalance: balanceTotal,
                netSavings: incomeTotal - expenseTotal
            });
        };

        if (expenses.length > 0 || wallets.length > 0) {
            calculateStats();
        }
    }, [expenses, wallets, profile.currency]);

    // Chart Data with Normalization
    const [normalizedChartData, setNormalizedChartData] = useState<any[]>([]);

    useEffect(() => {
        const calculateChart = async () => {
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(new Date(), 6 - i);
                return d;
            });

            const data = await Promise.all(last7Days.map(async (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayExpenses = expenses.filter(e => {
                    if (e.category?.type !== 'expense') return false;
                    const expenseDateStr = format(new Date(e.date), 'yyyy-MM-dd');
                    return expenseDateStr === dateStr;
                });

                let dailyTotal = 0;
                for (const e of dayExpenses) {
                    const amount = Number(e.amount);
                    const currency = e.currency || profile.currency || 'USD';

                    if (currency === profile.currency) {
                        dailyTotal += amount;
                    } else {
                        try {
                            const rate = await getHistoricalRate(new Date(e.date), currency, profile.currency);
                            dailyTotal += amount * rate;
                        } catch (err) {
                            dailyTotal += amount;
                        }
                    }
                }

                return {
                    name: format(date, 'EEE'),
                    amount: dailyTotal,
                    fullDate: format(date, 'MMM dd')
                };
            }));

            setNormalizedChartData(data);
        };

        if (expenses.length > 0) {
            calculateChart();
        }
    }, [expenses, profile.currency]);

    const recentTransactions = expenses.slice(0, 5);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <Typography variant="h4" fontWeight="bold" className="text-text-primary">Dashboard</Typography>
                <div className="text-sm text-text-secondary">
                    Overview for {format(new Date(), 'MMMM yyyy')}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Total Balance"
                    amounts={{ [profile.currency]: normalizedStats.totalBalance }}
                    icon={Wallet}
                    color="bg-indigo-500"
                    trendLabel="across all wallets"
                />
                <StatCard
                    title="Monthly Expenses"
                    amounts={{ [profile.currency]: normalizedStats.totalExpenses }}
                    icon={TrendingDown}
                    color="bg-red-500"
                />
                <StatCard
                    title="Monthly Income"
                    amounts={{ [profile.currency]: normalizedStats.totalIncome }}
                    icon={TrendingUp}
                    color="bg-green-500"
                />
                <StatCard
                    title="Net Savings"
                    amounts={{ [profile.currency]: normalizedStats.netSavings }}
                    icon={normalizedStats.netSavings < 0 ? CreditCard : DollarSign}
                    color={normalizedStats.netSavings < 0 ? "bg-orange-500" : "bg-emerald-500"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-background-paper">
                    <CardContent>
                        <h2 className="text-lg font-bold mb-6 text-text-primary">
                            Spending Trend (Last 7 Days)
                            <span className="text-sm font-normal text-text-secondary ml-2">
                                ({profile.currency})
                            </span>
                        </h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={normalizedChartData}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-paper)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: 'var(--text-primary)' }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#EF4444" fillOpacity={1} fill="url(#colorAmount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="bg-background-paper cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/expenses')}
                >
                    <CardContent>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-text-primary">Recent Transactions</h2>
                            <span className="text-xs text-indigo-500 font-medium hover:underline">View All</span>
                        </div>
                        <div className="space-y-4">
                            {recentTransactions.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No transactions yet.</p>
                            )}
                            {recentTransactions.map((expense) => (
                                <div key={expense.id} className="flex items-center justify-between p-3 hover:bg-background-default rounded-lg transition-colors">
                                    <div className="flex items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${expense.category?.type === 'income'
                                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                            : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                            }`}>
                                            {expense.category?.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                        </div>
                                        <div className="ml-3">
                                            <p className="font-medium text-text-primary">{expense.description}</p>
                                            <p className="text-xs text-text-secondary">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                                        </div>
                                    </div>
                                    <span className={`font-semibold ${expense.category?.type === 'income'
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {expense.category?.type === 'income' ? '+' : '-'}
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: expense.currency || profile.currency || 'USD'
                                        }).format(Number(expense.amount))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
