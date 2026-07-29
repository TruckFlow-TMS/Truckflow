import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PermissionKey, PermissionScope } from '../types/tms';
import { SEED_USERS } from '../services/mockData';
import { mockStore } from '../services/mockStore';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  setCurrentUser: (user: User) => void;
  hasPermission: (key: PermissionKey, scope?: PermissionScope) => boolean;
  isAdmin: boolean;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'nune_tms_jwt_token';
const USER_KEY = 'nune_tms_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return SEED_USERS[0]; // Default to Admin for quick preview
  });

  useEffect(() => { mockStore.getUsers().then(setUsers); }, []);

  const refreshUsers = () => { mockStore.getUsers().then(setUsers); };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const login = async (usernameOrEmail: string, password: string) => {
    // 1. Try real API
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(TOKEN_KEY, data.access_token);
        const allUsers = await mockStore.getUsers();
        const mapped = allUsers.find(u => u.username === data.user?.username || u.email === data.user?.email) || SEED_USERS[0];
        setCurrentUser(mapped);
        return;
      }
    } catch { /* fallback to mock */ }

    // 2. Mock auth fallback
    const allUsers = await mockStore.getUsers();
    const match = allUsers.find(u => (u.username === usernameOrEmail || u.email === usernameOrEmail));
    if (!match) throw new Error('Invalid username or email address.');
    if (!match.isActive) throw new Error('Account has been deactivated. Contact your administrator.');
    if (match.expirationDate) {
      if (new Date(match.expirationDate) < new Date()) {
        throw new Error(`Account expired on ${match.expirationDate}. Contact admin to renew.`);
      }
    }
    const mockJwt = `mock.${btoa(match.username)}.token`;
    localStorage.setItem(TOKEN_KEY, mockJwt);
    setCurrentUser(match);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setCurrentUserState(null);
  };

  const isAdmin = currentUser ? (currentUser.isOwner || currentUser.roleName === 'Admin') : false;

  const hasPermission = (key: PermissionKey, requiredScope?: PermissionScope): boolean => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    const perms = currentUser.roles.flatMap(r => r.permissions);
    const match = perms.find(p => p.key === key);
    if (!match) return false;
    if (!requiredScope) return true;
    return match.scope === 'all' || match.scope === requiredScope;
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, setCurrentUser, hasPermission, isAdmin, refreshUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
