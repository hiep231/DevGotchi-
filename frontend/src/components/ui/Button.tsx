import React from 'react';
import { tg } from '../../utils/telegram';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'mint' | 'coral' | 'sky' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  haptic = 'medium',
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl',
    md: 'px-4 py-2.5 text-sm rounded-2xl',
    lg: 'px-5 py-3.5 text-base rounded-2xl h-14',
  }[size];

  const variantClasses = {
    primary: 'btn-chunky-primary',
    secondary: 'btn-chunky-secondary',
    mint: 'btn-chunky-mint',
    coral: 'btn-chunky-coral',
    sky: 'btn-chunky-sky',
    ghost: 'btn-chunky-ghost',
  }[variant];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    if (haptic) tg.haptic.impact(haptic === 'selection' ? 'light' : haptic);
    onClick?.(e);
  };

  return (
    <button
      className={`btn-chunky ${variantClasses} ${sizeClasses} ${className} ${
        isLoading ? 'cursor-wait opacity-80' : ''
      }`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
          <span>Đang xử lý...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
