export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    theme_preference: 'light' | 'dark';
    currency: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    color: string;
    icon: string;
    type: 'income' | 'expense';
    group_id?: string;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    group_id?: string;
}

export interface Wallet {
    id: string;
    name: string;
    type: 'cash' | 'bank' | 'credit_card' | 'digital_wallet';
    balance: number;
    currency: string;
    color: string;
    icon: string;
    group_id?: string;
}

export interface Expense {
    id: string;
    amount: number;
    description: string;
    date: string;
    category_id?: string;
    wallet_id?: string;
    group_id?: string;
    created_by: string;
    created_at: string;
    category?: Category;
    wallet?: Wallet;
    tags?: Tag[];
    currency?: string;
    status?: 'completed' | 'pending';
    recurring_expense_id?: string;
}

export interface RecurringExpense {
    id: string;
    amount: number;
    description: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    start_date: string;
    end_date?: string | null;
    last_processed?: string | null;
    category_id: string;
    wallet_id: string;
    group_id?: string;
    created_by: string;
    created_at: string;
    category?: Category;
    wallet?: Wallet;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    created_by: string;
    created_at: string;
}

export interface GroupMember {
    id: string;
    group_id: string;
    user_id: string;
    role: 'admin' | 'member' | 'viewer';
    permissions: {
        can_add_expense: boolean;
        can_edit_expense: boolean;
        can_delete_expense: boolean;
        can_manage_categories: boolean;
        can_manage_tags: boolean;
        can_manage_wallets: boolean;
        can_invite_members: boolean;
        can_view_reports: boolean;
    };
    joined_at: string;
    profile?: UserProfile;
}

export interface ExpenseFormData {
    amount: number;
    description: string;
    date: Date;
    category_id: string;
    wallet_id: string;
    tag_ids: string[];
    group_id?: string;
    currency: string;
    recurrence?: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
        interval: number;
        end_date?: Date;
    };
}
