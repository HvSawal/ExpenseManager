import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { acceptInvitation } from '../api/groups';
import { Box, Typography, CircularProgress, Button, Paper } from '@mui/material';
import { useUI } from '../contexts/UIContext';

const JoinGroup = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { showError } = useUI();
    const [isProcessing, setIsProcessing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const joinGroup = async () => {
            if (!token) {
                setError('Invalid invitation link');
                setIsProcessing(false);
                return;
            }

            try {
                const groupId = await acceptInvitation(token);
                navigate(`/groups/${groupId}`);
            } catch (err: any) {
                console.error('Failed to join group:', err);
                setError(err.message || 'Failed to join group. The link may be expired or invalid.');
                setIsProcessing(false);
            }
        };

        joinGroup();
    }, [token, navigate]);

    if (isProcessing) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2}>
                <CircularProgress />
                <Typography>Joining group...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh" p={2}>
                <Paper elevation={3} sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
                    <Typography variant="h5" color="error" gutterBottom>
                        Unable to Join
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        {error}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/')}>
                        Go to Dashboard
                    </Button>
                </Paper>
            </Box>
        );
    }

    return null;
};

export default JoinGroup;
