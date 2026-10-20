import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'sticker' | 'elevated' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'sticker',
  className = '',
  ...props
}) => {
  const variantClass = {
    sticker: 'card-sticker',
    elevated: 'card-elevated',
    flat: 'card-flat',
  }[variant];

  return (
    <div className={`${variantClass} p-4 ${className}`} {...props}>
      {children}
    </div>
  );
};
