import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to max
  max?: number;
  variant?: 'primary' | 'mint' | 'coral' | 'sky';
  height?: number; // pixel
  showGloss?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'primary',
  height = 16,
  showGloss = true,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / (max || 1)) * 100));

  const variantGradients = {
    primary: 'linear-gradient(90deg, #FFD166 0%, #FFB703 100%)',
    mint: 'linear-gradient(90deg, #48E5D6 0%, #2EC4B6 100%)',
    coral: 'linear-gradient(90deg, #FFA0A0 0%, #FF6B6B 100%)',
    sky: 'linear-gradient(90deg, #7BE0FF 0%, #4CC9F0 100%)',
  }[variant];

  return (
    <div
      style={{ height: `${height}px` }}
      className={`w-full bg-[var(--line)] border-2 border-[var(--ink)] rounded-full overflow-hidden relative ${className}`}
    >
      <div
        style={{
          width: `${percentage}%`,
          background: variantGradients,
        }}
        className="h-full rounded-full transition-all duration-500 ease-out relative"
      >
        {showGloss && (
          <div
            className="absolute top-[1px] left-1 right-1 h-[40%] rounded-full pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%)',
            }}
          />
        )}
      </div>
    </div>
  );
};
