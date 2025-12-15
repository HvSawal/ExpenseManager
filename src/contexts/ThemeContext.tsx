import React, { createContext, useContext, useEffect, useState } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>(() => {
        const savedMode = localStorage.getItem('theme') as ThemeMode;
        return savedMode || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    });

    useEffect(() => {
        const root = window.document.documentElement;
        localStorage.setItem('theme', mode);

        // Remove both potential classes to be safe
        root.classList.remove('light', 'dark');

        if (mode === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.add('light'); // Optional but good for explicit styling
        }
    }, [mode]);

    const toggleTheme = () => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const muiTheme = createTheme({
        palette: {
            mode,
            primary: {
                main: '#6C63FF', // Soft Indigo/Violet
                light: '#8F88FF',
                dark: '#4B44CC',
                contrastText: '#ffffff',
            },
            secondary: {
                main: '#2DD4BF', // Soft Teal
                light: '#5EEAD4',
                dark: '#14B8A6',
                contrastText: '#ffffff',
            },
            background: {
                default: mode === 'light' ? '#F3F4F6' : '#111827', // Gray-100 vs Gray-900
                paper: mode === 'light' ? '#FFFFFF' : '#1F2937', // White vs Gray-800
            },
            text: {
                primary: mode === 'light' ? '#1F2937' : '#F9FAFB',
                secondary: mode === 'light' ? '#6B7280' : '#9CA3AF',
            },
        },
        typography: {
            fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 700 },
            h2: { fontWeight: 700 },
            h3: { fontWeight: 600 },
            h4: { fontWeight: 600 },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            button: { fontWeight: 600, textTransform: 'none' },
        },
        shape: {
            borderRadius: 16,
        },
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: '24px',
                        boxShadow: mode === 'light'
                            ? '0 10px 30px -5px rgba(0, 0, 0, 0.05)'
                            : '0 10px 30px -5px rgba(0, 0, 0, 0.3)',
                        border: mode === 'light' ? '1px solid rgba(0,0,0,0.02)' : '1px solid rgba(255,255,255,0.05)',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: mode === 'light'
                                ? '0 20px 40px -5px rgba(0, 0, 0, 0.1)'
                                : '0 20px 40px -5px rgba(0, 0, 0, 0.4)',
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: '24px',
                        backgroundImage: 'none', // Remove default gradient in dark mode
                    },
                    elevation1: {
                        boxShadow: mode === 'light'
                            ? '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
                            : '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
                    }
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: '12px',
                        padding: '10px 24px',
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)', // Glow effect on hover
                        },
                    },
                    containedPrimary: {
                        background: 'linear-gradient(135deg, #6C63FF 0%, #5A52E0 100%)',
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                        },
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: '8px',
                        fontWeight: 500,
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: '28px',
                    }
                }
            }
        },
    });

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <MuiThemeProvider theme={muiTheme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
