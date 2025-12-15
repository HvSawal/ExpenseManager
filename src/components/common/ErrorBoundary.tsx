import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Refresh, ErrorOutline } from '@mui/icons-material';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="100vh"
                    bgcolor="background.default"
                >
                    <Container maxWidth="sm">
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                borderRadius: 4,
                                bgcolor: 'background.paper'
                            }}
                        >
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3
                                }}
                            >
                                <ErrorOutline sx={{ fontSize: 48, color: 'error.main' }} />
                            </Box>
                            <Typography variant="h4" fontWeight="bold" gutterBottom color="text.primary">
                                Oops! Something went wrong
                            </Typography>
                            <Typography color="text.secondary" paragraph sx={{ mb: 4 }}>
                                We encountered an unexpected error. Please try refreshing the page.
                            </Typography>
                            {this.state.error && (
                                <Box
                                    sx={{
                                        bgcolor: 'rgba(0,0,0,0.05)',
                                        p: 2,
                                        borderRadius: 2,
                                        mb: 4,
                                        textAlign: 'left',
                                        overflow: 'auto',
                                        maxHeight: 100
                                    }}
                                >
                                    <Typography variant="caption" fontFamily="monospace" color="error">
                                        {this.state.error.toString()}
                                    </Typography>
                                </Box>
                            )}
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Refresh />}
                                onClick={() => window.location.reload()}
                                sx={{ borderRadius: 2, px: 4 }}
                            >
                                Reload Page
                            </Button>
                        </Paper>
                    </Container>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
