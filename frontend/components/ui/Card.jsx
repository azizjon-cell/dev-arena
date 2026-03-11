/**
 * Card Component
 */

import { clsx } from 'clsx';

export function Card({ 
  children, 
  className,
  hover = true,
  glow = false,
  ...props 
}) {
  return (
    <div
      className={clsx(
        'bg-dark-card border border-dark-border rounded-xl p-6',
        hover && 'transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
        glow && 'glow-primary',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={clsx('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={clsx('text-xl font-semibold text-white', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }) {
  return (
    <p className={clsx('text-gray-400 text-sm mt-1', className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }) {
  return (
    <div className={clsx('', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-dark-border', className)}>
      {children}
    </div>
  );
}
