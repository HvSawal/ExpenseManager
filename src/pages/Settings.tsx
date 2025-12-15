import React, { useRef } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Avatar,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Grid,
    Stack
} from '@mui/material';
import {
    Upload,
    Download,
    DeleteForever
} from '@mui/icons-material';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import { exportToCSV, exportToPDF } from '../utils/export';
import { getExpenses } from '../api/expenses';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useUI } from '../contexts/UIContext';

const Settings = () => {
    const { profile, updateProfile } = useUserProfile();
    const { mode, toggleTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showError } = useUI();

    const { data: expenses = [] } = useQuery({
        queryKey: ['expenses'],
        queryFn: getExpenses
    });

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateProfile({ avatar: reader.result as string });
                toast.success('Profile photo updated');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExportCSV = () => {
        try {
            exportToCSV(expenses, `expenses_export_${new Date().toISOString().split('T')[0]}`);
            toast.success('Expenses exported to CSV');
        } catch (error: any) {
            showError('Export Failed', error.message || 'Failed to export CSV.');
        }
    };

    const handleExportPDF = () => {
        try {
            exportToPDF(expenses, 'Expense Report');
            toast.success('Expenses exported to PDF');
        } catch (error: any) {
            showError('Export Failed', error.message || 'Failed to export PDF.');
        }
    };

    const handleClearData = () => {
        if (window.confirm('Are you sure? This will delete ALL data (Expenses, Categories, Wallets, etc.) and cannot be undone.')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <Box className="space-y-8">
            <Typography variant="h4" className="text-text-primary" fontWeight="bold" mb={2}>
                Settings
            </Typography>

            {/* Profile Section */}
            <Card className="bg-background-paper">
                <CardContent className="space-y-6">
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Typography variant="h6" className="text-text-primary">Profile Settings</Typography>
                    </Box>
                    <Divider className="border-border" />

                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={4} paddingTop={2} alignItems="center">
                        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                            <Avatar
                                src={profile.avatar || undefined}
                                sx={{ width: 100, height: 100, fontSize: '2.5rem' }}
                            >
                                {profile.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<Upload />}
                                size="small"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Change Photo
                            </Button>
                        </Box>

                        <Stack flex={1} width="100%" spacing={3}>
                            <TextField
                                label="Display Name"
                                fullWidth
                                value={profile.name}
                                onChange={(e) => updateProfile({ name: e.target.value })}
                                variant="outlined"
                            />
                            <TextField
                                label="Email Address"
                                fullWidth
                                value={profile.email}
                                onChange={(e) => updateProfile({ email: e.target.value })}
                                variant="outlined"
                            />
                            <FormControl fullWidth>
                                <InputLabel>Currency</InputLabel>
                                <Select
                                    value={profile.currency}
                                    label="Currency"
                                    onChange={(e) => updateProfile({ currency: e.target.value })}
                                >
                                    <MenuItem value="USD">USD ($)</MenuItem>
                                    <MenuItem value="EUR">EUR (€)</MenuItem>
                                    <MenuItem value="GBP">GBP (£)</MenuItem>
                                    <MenuItem value="INR">INR (₹)</MenuItem>
                                    <MenuItem value="JPY">JPY (¥)</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>

            {/* Appearance Section */}
            <Card className="bg-background-paper">
                <CardContent className="space-y-6">
                    <Typography variant="h6" className="text-text-primary">Appearance</Typography>
                    <Divider className="border-border" />

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography className="text-text-primary font-medium">Theme Mode</Typography>
                            <Typography variant="body2" className="text-text-secondary">
                                Toggle between light and dark mode
                            </Typography>
                        </Box>
                        <FormControlLabel
                            control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
                            label={mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Data Management Section */}
            <Card className="bg-background-paper">
                <CardContent className="space-y-6">
                    <Typography variant="h6" className="text-text-primary">Data Management</Typography>
                    <Divider className="border-border" />

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Download />}
                                onClick={handleExportCSV}
                            >
                                Export to CSV
                            </Button>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Download />}
                                onClick={handleExportPDF}
                            >
                                Export to PDF
                            </Button>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Box mt={2} p={2} className="bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                                <Typography variant="subtitle2" className="text-red-600 dark:text-red-400 font-bold mb-1">
                                    Danger Zone
                                </Typography>
                                <Typography variant="body2" className="text-red-600/80 dark:text-red-400/80 mb-3">
                                    Once you delete your data, there is no going back. Please be certain.
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<DeleteForever />}
                                    onClick={handleClearData}
                                >
                                    Delete All Data
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Settings;
