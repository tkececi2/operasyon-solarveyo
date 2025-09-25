import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    secondary: 'bg-purple-100 text-purple-800'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          variant === 'success' ? 'bg-green-600' :
          variant === 'warning' ? 'bg-yellow-600' :
          variant === 'danger' ? 'bg-red-600' :
          variant === 'error' ? 'bg-red-600' :
          variant === 'info' ? 'bg-blue-600' :
          variant === 'secondary' ? 'bg-purple-600' :
          'bg-gray-600'
        }`} />
      )}
      {children}
    </span>
  );
};

// Status Badge için özel component'ler
export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ 
  status, 
  className = '' 
}) => {
  const getVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'acik':
      case 'aktif':
      case 'active':
        return 'danger';
      case 'devam-ediyor':
      case 'devam ediyor':
        return 'warning';
      case 'beklemede':
      case 'pending':
        return 'info';
      case 'cozuldu':
      case 'çözüldü':
      case 'tamamlandi':
      case 'tamamlandı':
      case 'completed':
        return 'success';
      case 'iptal':
      case 'cancelled':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'acik':
        return 'Açık';
      case 'devam-ediyor':
        return 'Devam Ediyor';
      case 'beklemede':
        return 'Beklemede';
      case 'cozuldu':
        return 'Çözüldü';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getVariant(status)} className={className} dot>
      {getLabel(status)}
    </Badge>
  );
};

// Priority Badge
export const PriorityBadge: React.FC<{ priority: string; className?: string }> = ({ 
  priority, 
  className = '' 
}) => {
  const getVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'kritik':
        return 'danger';
      case 'yuksek':
      case 'yüksek':
        return 'warning';
      case 'normal':
        return 'info';
      case 'dusuk':
      case 'düşük':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getLabel = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'kritik':
        return 'Kritik';
      case 'yuksek':
        return 'Yüksek';
      case 'normal':
        return 'Normal';
      case 'dusuk':
        return 'Düşük';
      default:
        return priority;
    }
  };

  return (
    <Badge variant={getVariant(priority)} className={className}>
      {getLabel(priority)}
    </Badge>
  );
};
