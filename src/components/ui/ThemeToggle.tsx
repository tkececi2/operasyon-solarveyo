import React, { useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, actualTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light' as const, label: 'Açık', icon: Sun },
    { value: 'dark' as const, label: 'Koyu', icon: Moon },
    { value: 'system' as const, label: 'Sistem', icon: Monitor }
  ];

  const currentThemeData = themes.find(t => t.value === theme);
  const Icon = currentThemeData?.icon || Sun;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Tema değiştir"
      >
        <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            {themes.map(({ value, label, icon: ThemeIcon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-sm
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                  ${theme === value 
                    ? 'text-blue-600 dark:text-blue-400 font-medium' 
                    : 'text-gray-700 dark:text-gray-300'
                  }
                  ${value === 'light' && 'rounded-t-lg'}
                  ${value === 'system' && 'rounded-b-lg'}
                `}
              >
                <ThemeIcon className="h-4 w-4" />
                <span>{label}</span>
                {theme === value && (
                  <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;
