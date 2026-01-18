/**
 * Utility to prefetch dynamic imports (lazy components)
 * Call this when a user is likely to navigate to a specific page soon (e.g., while typing login credentials)
 */
export const prefetchPage = (pageName: 'PassengerHome' | 'DriverHome' | 'Admin' | 'Wallet' | 'Profile') => {
    switch (pageName) {
        case 'PassengerHome':
            import('../pages/PassengerHome');
            break;
        case 'DriverHome':
            import('../pages/DriverHome');
            break;
        case 'Admin':
            import('../pages/ProfessionalAdminDashboard');
            break;
        case 'Wallet':
            import('../pages/Wallet');
            break;
        case 'Profile':
            import('../pages/UserProfile');
            break;
    }
};
