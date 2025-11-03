'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('light');
  const [posts, setPosts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [polls, setPolls] = useState([]);

  // Responsive default for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force light theme regardless of system or stored preference
  useEffect(() => {
    setTheme('light');
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      try { document.documentElement.style.colorScheme = 'light'; } catch (_) {}
    }
    try { if (typeof window !== 'undefined') localStorage.setItem('theme', 'light'); } catch (_) {}
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', theme);
    try { if (typeof window !== 'undefined') localStorage.setItem('theme', theme); } catch (_) {}
  }, [theme]);

  const login = (userData) => setUser(userData || null);
  const logout = () => setUser(null);
  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleTheme = () => setTheme('light');

  const addPost = (post) => setPosts((prev) => [{ id: Date.now(), ...post }, ...prev]);
  const addQuestion = (q) => setQuestions((prev) => [{ id: Date.now(), ...q }, ...prev]);
  const addPoll = (p) => setPolls((prev) => [{ id: Date.now(), ...p }, ...prev]);
  const likePost = () => {};
  const votePoll = () => {};

  const value = useMemo(() => ({
    user,
    sidebarOpen,
    theme,
    posts,
    questions,
    polls,
    login,
    logout,
    toggleSidebar,
    closeSidebar,
    toggleTheme,
    addPost,
    addQuestion,
    addPoll,
    likePost,
    votePoll,
  }), [user, sidebarOpen, theme, posts, questions, polls]);

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}


