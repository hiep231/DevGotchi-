import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'grape' | 'mint' | 'coral' | 'sky';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.2 min-w-4 h-4',
    md: 'text-xs px-2 py-0.5 min-w-5 h-5',
  }[size];

  const variantClasses = {
    primary: 'bg-[var(--primary)] text-[var(--ink)]',
    grape: 'bg-[var(--grape)] text-white',
    mint: 'bg-[var(--mint)] text-white',
    coral: 'bg-[var(--coral)] text-white',
    sky: 'bg-[var(--sky)] text-[var(--ink)]',
  }[variant];

  return (
    <span
      className={`badge-sticker ${variantClasses} ${sizeClasses} shadow-sm ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
