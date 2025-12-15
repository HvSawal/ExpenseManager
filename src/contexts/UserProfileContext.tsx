import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface UserProfile {
    name: string;
    email: string;
    avatar: string | null;
    currency: string;
}

interface UserProfileContextType {
    profile: UserProfile;
    updateProfile: (updates: Partial<UserProfile>) => void;
}

const defaultProfile: UserProfile = {
    name: 'User',
    email: '',
    avatar: null,
    currency: 'USD'
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
    const [profile, setProfile] = useState<UserProfile>(() => {
        const saved = localStorage.getItem('userProfile');
        return saved ? JSON.parse(saved) : defaultProfile;
    });

    useEffect(() => {
        localStorage.setItem('userProfile', JSON.stringify(profile));
    }, [profile]);

    const updateProfile = (updates: Partial<UserProfile>) => {
        setProfile(prev => ({ ...prev, ...updates }));
    };

    return (
        <UserProfileContext.Provider value={{ profile, updateProfile }}>
            {children}
        </UserProfileContext.Provider>
    );
};

export const useUserProfile = () => {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};
