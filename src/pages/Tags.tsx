import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Button,
    Typography,
    Card,
    CardContent,
    IconButton,
    Grid,
    CircularProgress
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { getTags, deleteTag } from '../api/tags';
import TagDialog from '../components/tags/TagDialog';
import type { Tag } from '../types';
import toast from 'react-hot-toast';

const Tags = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);
    const queryClient = useQueryClient();

    const { data: tags = [], isLoading } = useQuery({
        queryKey: ['tags'],
        queryFn: getTags,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            toast.success('Tag deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete tag');
        }
    });

    const handleAddClick = () => {
        setTagToEdit(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (tag: Tag) => {
        setTagToEdit(tag);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        if (window.confirm('Are you sure you want to delete this tag?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold" className="text-text-primary">
                    Tags
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddClick}
                >
                    Add Tag
                </Button>
            </Box>

            <Grid container spacing={3}>
                {tags.map((tag) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={tag.id}>
                        <Card sx={{ bgcolor: tag.color, color: '#fff', borderRadius: 2 }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography fontWeight="bold" variant="subtitle2" noWrap title={tag.name}>
                                        {tag.name}
                                    </Typography>
                                    <Box display="flex" gap={0.5}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditClick(tag)}
                                            sx={{
                                                color: 'rgba(255, 255, 255, 0.8)',
                                                padding: 0.5,
                                                '&:hover': { color: '#fff', bgcolor: 'rgba(255, 255, 255, 0.1)' }
                                            }}
                                        >
                                            <Edit sx={{ fontSize: 16 }} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteClick(tag.id)}
                                            sx={{
                                                color: 'rgba(255, 255, 255, 0.8)',
                                                padding: 0.5,
                                                '&:hover': { color: '#fff', bgcolor: 'rgba(255, 255, 255, 0.1)' }
                                            }}
                                        >
                                            <Delete sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {tags.length === 0 && (
                <Box textAlign="center" py={8} color="text.secondary">
                    <Typography>No tags found. Create one to get started!</Typography>
                </Box>
            )}

            <TagDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                tagToEdit={tagToEdit}
            />
        </Box>
    );
};

export default Tags;
