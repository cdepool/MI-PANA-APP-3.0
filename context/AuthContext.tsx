
import React, { createContext, useContext, useState } from 'react';
import { AuthContextType, User, UserRole, SavedPlace } from '../types';
import { mockLoginUser, simulateGoogleAuth } from '../services/mockService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (role: UserRole) => {
    // Simulate API call
    const newUser = mockLoginUser(role);
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const addSavedPlace = (place: SavedPlace) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      return {
        ...currentUser,
        savedPlaces: [...(currentUser.savedPlaces || []), place]
      };
    });
  };

  const removeSavedPlace = (id: string) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      return {
        ...currentUser,
        savedPlaces: (currentUser.savedPlaces || []).filter((p) => p.id !== id)
      };
    });
  };

  const connectGoogle = async () => {
    if (!user) return;
    try {
      const googleProfile = await simulateGoogleAuth(user);
      setUser({
        ...user,
        googleProfile
      });
    } catch (error) {
      console.error("Error connecting google", error);
    }
  };

  const disconnectGoogle = () => {
    if (!user) return;
    const { googleProfile, ...rest } = user;
    setUser(rest);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
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
