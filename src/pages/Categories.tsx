import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Button,
    Typography,
    Card,
    CardContent,
    IconButton,
    CircularProgress,
    Tabs,
    Tab
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { getCategories, deleteCategory } from '../api/categories';
import CategoryDialog from '../components/categories/CategoryDialog';
import type { Category } from '../types';
import toast from 'react-hot-toast';

const Categories = () => {
    const [tabValue, setTabValue] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
    const queryClient = useQueryClient();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete category');
        }
    });

    const handleAddClick = () => {
        setCategoryToEdit(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (category: Category) => {
        setCategoryToEdit(category);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            deleteMutation.mutate(id);
        }
    };

    const filteredCategories = categories.filter(category =>
        tabValue === 0 ? category.type === 'expense' : category.type === 'income'
    );

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
                    Categories
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddClick}
                >
                    Add {tabValue === 0 ? 'Expense' : 'Income'} Category
                </Button>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} indicatorColor="primary" textColor="primary">
                    <Tab label="Expense" />
                    <Tab label="Income" />
                </Tabs>
            </Box>

            <Box display="flex" flexWrap="wrap" gap={2}>
                {filteredCategories.map((category) => (
                    <Card key={category.id} sx={{ bgcolor: category.color, color: '#fff', borderRadius: 8, width: 'fit-content', maxWidth: '100%' }}>
                        <CardContent sx={{ p: '8px 16px !important' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                                <Box display="flex" alignItems="center" gap={1.5}>
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.2rem',
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            color: '#fff',
                                            flexShrink: 0
                                        }}
                                    >
                                        {category.icon}
                                    </Box>
                                    <Typography fontWeight="bold" variant="subtitle1" noWrap>
                                        {category.name}
                                    </Typography>
                                </Box>
                                <Box display="flex" gap={0.5}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditClick(category)}
                                        sx={{
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            padding: 0.5,
                                            '&:hover': { color: '#fff', bgcolor: 'rgba(255, 255, 255, 0.1)' }
                                        }}
                                    >
                                        <Edit sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteClick(category.id)}
                                        sx={{
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            padding: 0.5,
                                            '&:hover': { color: '#fff', bgcolor: 'rgba(255, 255, 255, 0.1)' }
                                        }}
                                    >
                                        <Delete sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {filteredCategories.length === 0 && (
                <Box textAlign="center" py={8} color="text.secondary">
                    <Typography>No {tabValue === 0 ? 'expense' : 'income'} categories found. Create one to get started!</Typography>
                </Box>
            )}

            <CategoryDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                categoryToEdit={categoryToEdit}
                defaultType={tabValue === 0 ? 'expense' : 'income'}
            />
        </Box>
    );
};

export default Categories;
