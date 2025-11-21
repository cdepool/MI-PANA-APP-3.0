import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, UserRole, SavedPlace } from '../types';
import { mockLoginUser, simulateGoogleAuth } from '../services/mockService';
import { authService } from '../services/authService';

interface ExtendedAuthContextType extends AuthContextType {
  loginPassenger: (phone: string, pin: string) => Promise<void>;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    const storedUser = authService.getSession();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = (role: UserRole, userData?: Partial<User>) => {
    // Legacy/Mock login for Driver/Admin
    const baseUser = mockLoginUser(role);
    const finalUser = userData ? { ...baseUser, ...userData } : baseUser;
    
    setUser(finalUser);
    // Only persist if it's a passenger (since we only implemented real auth for them)
    if (role === UserRole.PASSENGER) {
      authService.setSession(finalUser);
    }
  };

  const loginPassenger = async (phone: string, pin: string) => {
    try {
      const loggedUser = await authService.loginPassenger(phone, pin);
      setUser(loggedUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    authService.logout();
  };

  const addSavedPlace = (place: SavedPlace) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      const updatedUser = {
        ...currentUser,
        savedPlaces: [...(currentUser.savedPlaces || []), place]
      };
      // Update local storage if it's a real session
      authService.setSession(updatedUser);
      return updatedUser;
    });
  };

  const removeSavedPlace = (id: string) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      const updatedUser = {
        ...currentUser,
        savedPlaces: (currentUser.savedPlaces || []).filter((p) => p.id !== id)
      };
      authService.setSession(updatedUser);
      return updatedUser;
    });
  };

  const connectGoogle = async () => {
    if (!user) return;
    try {
      const googleProfile = await simulateGoogleAuth(user);
      const updatedUser = { ...user, googleProfile };
      setUser(updatedUser);
      authService.setSession(updatedUser);
    } catch (error) {
      console.error("Error connecting google", error);
    }
  };

  const disconnectGoogle = () => {
    if (!user) return;
    const { googleProfile, ...rest } = user;
    setUser(rest);
    authService.setSession(rest);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-mipana-darkBlue"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div></div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginPassenger,
      logout, 
      isAuthenticated: !!user,
      addSavedPlace,
      removeSavedPlace,
      connectGoogle,
      disconnectGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};