import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  username: string;
  fullName: string;
  email: string;
  role: "technician" | "doctor";
  createdAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// localStorage wrapper with Safari check
const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting localStorage:', error);
      return false;
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return storage.get("currentUser");
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if localStorage is available
    try {
      const testKey = "__test__";
      storage.set(testKey, testKey);
      storage.remove(testKey);
    } catch (e) {
      console.error("localStorage is not available:", e);
    }

    const authStatus = storage.get("isAuthenticated");
    const savedUser = storage.get("currentUser");
    
    if (authStatus === true && savedUser) {
      setIsAuthenticated(true);
      setCurrentUser(savedUser);
    }
  }, []);

  const login = (user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    storage.set("isAuthenticated", true);
    storage.set("currentUser", user);
    
    // Role-based redirection
    if (user.role === "doctor") {
      navigate("/doctor-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    storage.remove("isAuthenticated");
    storage.remove("currentUser");
    navigate("/");
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...data };
    const users = storage.get("users") || [];
    const updatedUsers = users.map((user: User) => 
      user.username === currentUser.username ? updatedUser : user
    );

    storage.set("users", updatedUsers);
    storage.set("currentUser", updatedUser);
    setCurrentUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      currentUser, 
      login, 
      logout,
      updateUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}