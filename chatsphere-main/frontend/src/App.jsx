import { Suspense } from 'react';
import AppRouter from './routes/AppRouter';
import { useTheme } from './context/ThemeContext';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const { theme } = useTheme();

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <Suspense fallback={<div className="min-h-screen bg-[var(--wa-bg)] p-4"><LoadingScreen label="Loading workspace" /></div>}>
        <AppRouter />
      </Suspense>
    </div>
  );
}