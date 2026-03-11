/**
 * Button Component
 */

import { forwardRef } from 'react';
import { clsx } from 'clsx';

const variants = {
  primary: 'bg-primary text-dark-bg hover:bg-primary-dark glow-primary',
  secondary: 'bg-dark-card border border-dark-border text-white hover:border-primary hover:text-primary',
  ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-dark-hover',
  danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30',
  success: 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  disabled,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      className={clsx(
        'rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
