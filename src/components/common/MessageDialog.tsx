import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton
} from '@mui/material';
import {
    CheckCircle,
    Error as ErrorIcon,
    Info,
    Warning,
    Close
} from '@mui/icons-material';

export type MessageType = 'success' | 'error' | 'info' | 'warning';

interface MessageDialogProps {
    open: boolean;
    title: string;
    message: string;
    type?: MessageType;
    onClose: () => void;
    actionLabel?: string;
    onAction?: () => void;
}

const MessageDialog = ({
    open,
    title,
    message,
    type = 'info',
    onClose,
    actionLabel,
    onAction
}: MessageDialogProps) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />;
            case 'error': return <ErrorIcon sx={{ fontSize: 40, color: 'error.main' }} />;
            case 'warning': return <Warning sx={{ fontSize: 40, color: 'warning.main' }} />;
            default: return <Info sx={{ fontSize: 40, color: 'info.main' }} />;
        }
    };

    const getHeaderColor = () => {
        switch (type) {
            case 'success': return 'rgba(34, 197, 94, 0.1)';
            case 'error': return 'rgba(239, 68, 68, 0.1)';
            case 'warning': return 'rgba(249, 115, 22, 0.1)';
            default: return 'rgba(59, 130, 246, 0.1)';
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden'
                }
            }}
        >
            <Box
                sx={{
                    bgcolor: getHeaderColor(),
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    position: 'relative'
                }}
            >
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'text.secondary'
                    }}
                >
                    <Close />
                </IconButton>
                {getIcon()}
                <DialogTitle sx={{ p: 0, fontWeight: 'bold', textAlign: 'center' }}>
                    {title}
                </DialogTitle>
            </Box>

            <DialogContent sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                    {message}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    sx={{ borderRadius: 2, px: 3 }}
                >
                    Close
                </Button>
                {actionLabel && onAction && (
                    <Button
                        variant="contained"
                        color={type === 'error' ? 'error' : 'primary'}
                        onClick={() => {
                            onAction();
                            onClose();
                        }}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        {actionLabel}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default MessageDialog;
