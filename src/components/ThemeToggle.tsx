/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = localStorage.getItem('theme');
    
    if (initialTheme === 'dark' || (!initialTheme && window.matchMedia('(pre-prefer-color-scheme: dark)').matches)) {
      root.classList.add('dark');
      setIsDark(true);
    } else {
      root.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <button
      id="theme-toggler"
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 shadow-sm"
      aria-label="Toggle Light/Dark Theme"
    >
      {isDark ? (
        <Sun className="h-4.5 w-4.5 text-amber-500 animate-[spin_40s_linear_infinite]" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-slate-600" />
      )}
    </button>
  );
}
