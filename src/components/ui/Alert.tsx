import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export type AlertVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

interface AlertProps {
  children: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
}

const variantStyles = {
  default: 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700',
  destructive: 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-400 border-red-200 dark:border-red-800',
  success: 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-400 border-green-200 dark:border-green-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

const iconMap = {
  default: AlertCircle,
  destructive: XCircle,
  success: CheckCircle,
  warning: AlertCircle,
  info: Info,
};

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const Icon = iconMap[variant];

  return (
    <div
      className={`
        rounded-lg border p-4 flex gap-3
        ${variantStyles[variant]}
        ${className}
      `}
      role="alert"
    >
      <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
    </div>
  );
};

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
};

interface AlertTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertTitle: React.FC<AlertTitleProps> = ({
  children,
  className = '',
}) => {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
      {children}
    </h5>
  );
};
