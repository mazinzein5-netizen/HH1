import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  bloodType: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: Omit<User, "id" | "createdAt">) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const USERS_KEY = "ibnceena_users";
const CURRENT_USER_KEY = "ibnceena_current_user";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (stored) setUser(JSON.parse(stored));
      } catch {}
      setLoading(false);
    })();
  }, []);

  async function login(username: string, password: string) {
    try {
      const stored = await AsyncStorage.getItem(USERS_KEY);
      const users: User[] = stored ? JSON.parse(stored) : [];
      const found = users.find(
        (u) =>
          u.username.toLowerCase() === username.toLowerCase() &&
          u.password === password
      );
      if (!found) return { success: false, error: "Invalid username or password" };
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(found));
      setUser(found);
      return { success: true };
    } catch {
      return { success: false, error: "Login failed. Please try again." };
    }
  }

  async function register(data: Omit<User, "id" | "createdAt">) {
    try {
      const stored = await AsyncStorage.getItem(USERS_KEY);
      const users: User[] = stored ? JSON.parse(stored) : [];
      if (users.find((u) => u.username.toLowerCase() === data.username.toLowerCase())) {
        return { success: false, error: "Username already taken" };
      }
      const newUser: User = {
        ...data,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return { success: true };
    } catch {
      return { success: false, error: "Registration failed. Please try again." };
    }
  }

  async function logout() {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
