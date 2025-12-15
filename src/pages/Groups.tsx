import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Card,
    CardContent,
    Typography,
    CircularProgress
} from '@mui/material';
import { Add, Group as GroupIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { getGroups, createGroup } from '../api/groups';
import toast from 'react-hot-toast';
import type { Group } from '../types';

import { useUI } from '../contexts/UIContext';

const Groups = () => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const queryClient = useQueryClient();
    const { showError } = useUI();

    const { data: groups = [], isLoading } = useQuery({
        queryKey: ['groups'],
        queryFn: getGroups,
    });

    const createMutation = useMutation({
        mutationFn: () => createGroup(newGroupName, newGroupDesc),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            toast.success('Group created successfully');
            setIsCreateOpen(false);
            setNewGroupName('');
            setNewGroupDesc('');
        },
        onError: (error: any) => {
            showError('Failed to Create Group', error.message || 'An unexpected error occurred while creating the group.');
        },
    });

    const handleCreate = () => {
        if (!newGroupName.trim()) return;
        createMutation.mutate();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Typography variant="h4" fontWeight="bold" className="text-text-primary">Expense Groups</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setIsCreateOpen(true)}
                    sx={{
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' }
                    }}
                >
                    Create Group
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group: Group) => (
                    <Link key={group.id} to={`/groups/${group.id}`} className="no-underline">
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer bg-background-paper">
                            <CardContent>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                        <GroupIcon className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <Typography variant="h6" className="text-text-primary">
                                        {group.name}
                                    </Typography>
                                </div>
                                <Typography variant="body2" className="text-text-secondary">
                                    {group.description || 'No description'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {groups.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        <Typography>No groups found. Create one to start sharing expenses!</Typography>
                    </div>
                )}
            </div>

            <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogContent className="space-y-4 pt-4">
                    <TextField
                        autoFocus
                        label="Group Name"
                        fullWidth
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                    />
                    <TextField
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={newGroupDesc}
                        onChange={(e) => setNewGroupDesc(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        disabled={!newGroupName.trim() || createMutation.isPending}
                    >
                        {createMutation.isPending ? 'Creating...' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Groups;
