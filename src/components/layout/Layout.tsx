import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { IconButton, Drawer } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Sidebar from './Sidebar';

const Layout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <div className="flex min-h-screen bg-background-default transition-colors duration-300">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-background-paper border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        className="mr-2 text-text-primary"
                    >
                        <MenuIcon />
                    </IconButton>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        Kharche
                    </h1>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:block fixed h-full z-10">
                <Sidebar />
            </div>

            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 256, border: 'none' },
                }}
            >
                <Sidebar onClose={handleDrawerToggle} />
            </Drawer>

            {/* Main Content */}
            <main className="flex-1 overflow-auto md:ml-64 pt-16 md:pt-0">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
