import { memo, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FiMoon } from 'react-icons/fi';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
    document.body.style.colorScheme = 'dark';
  }, [theme]);

  const toggleTheme = () => {
    setTheme('dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-[var(--wa-primary)] transition-colors hover:bg-[var(--wa-card-hover)] hover:shadow-[0_0_0_1px_rgba(10,132,255,0.16),0_0_16px_rgba(10,132,255,0.12)]"
      title="Dark mode enabled"
      aria-label="Toggle theme"
    >
      <FiMoon className="w-5 h-5" />
    </button>
  );
};

export default memo(ThemeSwitcher);
