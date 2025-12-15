import { createContext, useContext, useState, type ReactNode } from 'react';
import MessageDialog, { type MessageType } from '../components/common/MessageDialog';

interface UIContextType {
    showMessage: (title: string, message: string, type?: MessageType, actionLabel?: string, onAction?: () => void) => void;
    showError: (title: string, message: string) => void;
    showSuccess: (title: string, message: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [dialogState, setDialogState] = useState<{
        open: boolean;
        title: string;
        message: string;
        type: MessageType;
        actionLabel?: string;
        onAction?: () => void;
    }>({
        open: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showMessage = (
        title: string,
        message: string,
        type: MessageType = 'info',
        actionLabel?: string,
        onAction?: () => void
    ) => {
        setDialogState({
            open: true,
            title,
            message,
            type,
            actionLabel,
            onAction
        });
    };

    const showError = (title: string, message: string) => {
        showMessage(title, message, 'error');
    };

    const showSuccess = (title: string, message: string) => {
        showMessage(title, message, 'success');
    };

    const closeDialog = () => {
        setDialogState(prev => ({ ...prev, open: false }));
    };

    return (
        <UIContext.Provider value={{ showMessage, showError, showSuccess }}>
            {children}
            <MessageDialog
                open={dialogState.open}
                title={dialogState.title}
                message={dialogState.message}
                type={dialogState.type}
                onClose={closeDialog}
                actionLabel={dialogState.actionLabel}
                onAction={dialogState.onAction}
            />
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
