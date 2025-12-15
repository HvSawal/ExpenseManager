import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    Typography,
    CircularProgress,
    Tabs,
    Tab,
    Box,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip
} from '@mui/material';
import { PersonAdd, ArrowBack } from '@mui/icons-material';
import { getGroupDetails, getGroupMembers, inviteMember } from '../api/groups';
import toast from 'react-hot-toast';

import { useUI } from '../contexts/UIContext';

const GroupDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const { showError } = useUI();

    const { data: group, isLoading: isGroupLoading } = useQuery({
        queryKey: ['group', id],
        queryFn: () => getGroupDetails(id!),
        enabled: !!id,
    });

    const { data: members = [], isLoading: isMembersLoading } = useQuery({
        queryKey: ['groupMembers', id],
        queryFn: () => getGroupMembers(id!),
        enabled: !!id,
    });

    const inviteMutation = useMutation({
        mutationFn: () => inviteMember(id!, inviteEmail),
        onSuccess: () => {
            toast.success('Invitation sent successfully');
            setIsInviteOpen(false);
            setInviteEmail('');
        },
        onError: (error: any) => {
            showError('Failed to Send Invitation', error.message || 'An unexpected error occurred while sending the invitation.');
        },
    });

    const handleInvite = () => {
        if (!inviteEmail.trim()) return;
        inviteMutation.mutate();
    };

    if (isGroupLoading || isMembersLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <CircularProgress />
            </div>
        );
    }

    if (!group) {
        return <div>Group not found</div>;
    }

    return (
        <div className="space-y-6">
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/groups')}>
                Back to Groups
            </Button>

            <div className="flex justify-between items-start">
                <div>
                    <Typography variant="h4" className="font-bold dark:text-white">
                        {group.name}
                    </Typography>
                    <Typography variant="body1" className="text-gray-600 dark:text-gray-400 mt-1">
                        {group.description}
                    </Typography>
                </div>
                <Button
                    variant="outlined"
                    startIcon={<PersonAdd />}
                    onClick={() => setIsInviteOpen(true)}
                >
                    Invite Member
                </Button>
            </div>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                    <Tab label="Members" />
                    <Tab label="Expenses" />
                </Tabs>
            </Box>

            {tabValue === 0 && (
                <List className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    {members.map((member: any) => (
                        <ListItem key={member.id} divider>
                            <ListItemAvatar>
                                <Avatar src={member.profile?.avatar_url} alt={member.profile?.full_name}>
                                    {member.profile?.email?.[0]?.toUpperCase()}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <span className="font-medium dark:text-white">
                                        {member.profile?.full_name || member.profile?.email}
                                    </span>
                                }
                                secondary={
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {member.role} • Joined {new Date(member.joined_at).toLocaleDateString()}
                                    </span>
                                }
                            />
                            <Chip
                                label={member.role}
                                size="small"
                                color={member.role === 'admin' ? 'primary' : 'default'}
                                variant="outlined"
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            {tabValue === 1 && (
                <div className="text-center py-10 text-gray-500">
                    <Typography>Group expenses will be listed here.</Typography>
                </div>
            )}

            <Dialog open={isInviteOpen} onClose={() => setIsInviteOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Invite Member</DialogTitle>
                <DialogContent className="space-y-4 pt-4">
                    <Typography variant="body2" color="text.secondary">
                        Enter the email address of the person you want to invite to this group.
                    </Typography>
                    <TextField
                        autoFocus
                        label="Email Address"
                        type="email"
                        fullWidth
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleInvite}
                        variant="contained"
                        disabled={!inviteEmail.trim() || inviteMutation.isPending}
                    >
                        {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default GroupDetails;
