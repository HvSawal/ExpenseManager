import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Receipt,
    Tags,
    Wallet,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Hash
} from 'lucide-react';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { IconButton, Avatar, Box, Typography } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

interface SidebarProps {
    onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
    const { mode, toggleTheme } = useAppTheme();
    const { profile } = useUserProfile();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut();
            if (onClose) onClose();
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Receipt, label: 'Expenses', path: '/expenses' },
        { icon: Tags, label: 'Categories', path: '/categories' },
        { icon: Hash, label: 'Tags', path: '/tags' },
        { icon: Wallet, label: 'Wallets', path: '/wallets' },
        { icon: BarChart3, label: 'Reports', path: '/reports' },
        { icon: Users, label: 'Groups', path: '/groups' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="h-full w-64 border-r border-border flex flex-col transition-colors duration-300 bg-background-paper">
            <div className="p-6 flex items-center justify-between">
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                        src={profile.avatar || undefined}
                        sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                    >
                        {profile.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" className="text-text-primary leading-tight">
                            {profile.name}
                        </Typography>
                        <Typography variant="caption" className="text-text-secondary">
                            Kharche
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={toggleTheme} className="text-text-primary" size="small">
                    {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                : 'text-text-secondary hover:bg-background-default hover:text-text-primary'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-border">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-text-secondary hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
