import React from 'react';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'sticker' | 'primary' | 'mint' | 'coral' | 'sky' | 'grape' | 'neutral';
  size?: 'sm' | 'md';
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'sticker',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  const variantClass = {
    sticker: 'chip-sticker bg-white text-[var(--ink)]',
    primary: 'chip-flat bg-[var(--primary-tint)] text-[var(--primary-deep)] border border-[#E09A00]/40',
    mint: 'chip-flat bg-[var(--mint-tint)] text-[var(--mint-deep)] border border-[#1FA396]/40',
    coral: 'chip-flat bg-[var(--coral-tint)] text-[var(--coral-deep)] border border-[#D94141]/40',
    sky: 'chip-flat bg-[var(--sky-tint)] text-[var(--sky-deep)] border border-[#28A5CC]/40',
    grape: 'chip-flat bg-[var(--grape-tint)] text-[var(--grape-deep)] border border-[#6F5BD6]/40',
    neutral: 'chip-flat bg-white/80 text-[var(--ink-soft)] border border-[var(--line)]',
  }[variant];

  return (
    <div className={`inline-flex items-center gap-1.5 ${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </div>
  );
};
