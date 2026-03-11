/**
 * Input Component
 */

import { forwardRef } from 'react';
import { clsx } from 'clsx';

export const Input = forwardRef(({ 
  label,
  error,
  className,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full px-4 py-3 rounded-lg bg-dark-card border text-white placeholder-gray-500',
          'focus:outline-none focus:border-primary transition-colors',
          error ? 'border-red-500' : 'border-dark-border',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea Component
export const Textarea = forwardRef(({ 
  label,
  error,
  className,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={clsx(
          'w-full px-4 py-3 rounded-lg bg-dark-card border text-white placeholder-gray-500',
          'focus:outline-none focus:border-primary transition-colors resize-none',
          error ? 'border-red-500' : 'border-dark-border',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Select Component
export const Select = forwardRef(({ 
  label,
  error,
  options,
  className,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={clsx(
          'w-full px-4 py-3 rounded-lg bg-dark-card border text-white',
          'focus:outline-none focus:border-primary transition-colors',
          error ? 'border-red-500' : 'border-dark-border',
          className
        )}
        {...props}
      >
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
