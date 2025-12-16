// Theme Toggle Component for Dark Mode
'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
                onClick={() => setTheme('light')}
                className={`
          p-2 rounded-md transition-colors
          ${theme === 'light'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
        `}
                aria-label="Light mode"
            >
                <Sun className="h-4 w-4" />
            </button>

            <button
                onClick={() => setTheme('dark')}
                className={`
          p-2 rounded-md transition-colors
          ${theme === 'dark'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
        `}
                aria-label="Dark mode"
            >
                <Moon className="h-4 w-4" />
            </button>

            <button
                onClick={() => setTheme('system')}
                className={`
          p-2 rounded-md transition-colors
          ${theme === 'system'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
        `}
                aria-label="System theme"
            >
                <Monitor className="h-4 w-4" />
            </button>
        </div>
    );
}
