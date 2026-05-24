import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('chatsphere_theme') || 'dark');

  useEffect(() => {
    const nextTheme = 'dark';
    localStorage.setItem('chatsphere_theme', nextTheme);
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.style.colorScheme = 'dark';
    if (theme !== nextTheme) setTheme(nextTheme);
  }, [theme]);

  const value = useMemo(
    () => ({ theme: 'dark', setTheme: () => {}, toggleTheme: () => setTheme('dark') }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
};