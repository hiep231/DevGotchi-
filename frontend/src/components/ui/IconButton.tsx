import React from 'react';
import { tg } from '../../utils/telegram';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'sticker' | 'flat' | 'ghost';
  size?: number; // pixel diameter
  haptic?: 'light' | 'medium' | 'heavy' | 'selection';
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'flat',
  size = 40,
  haptic = 'light',
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (haptic) tg.haptic.impact(haptic === 'selection' ? 'light' : haptic);
    onClick?.(e);
  };

  const variantClass = {
    sticker: 'bg-white border-2 border-[var(--ink)] shadow-[0_3px_0_var(--ink)] active:translate-y-[2px] active:shadow-[0_1px_0_var(--ink)]',
    flat: 'bg-white border-[1.5px] border-[var(--line)] hover:border-[var(--line-strong)] active:bg-amber-50/50 active:scale-95 transition-transform',
    ghost: 'bg-transparent hover:bg-black/5 active:scale-90 transition-transform',
  }[variant];

  return (
    <button
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`rounded-2xl inline-flex items-center justify-center text-[var(--ink)] cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed ${variantClass} ${className}`}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};
