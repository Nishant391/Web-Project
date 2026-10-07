import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:scale-[0.99]',
        outline:
          'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]',
        secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-[0.99]',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm active:scale-[0.99]',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs rounded-lg',
        default: 'px-4 py-2 text-sm rounded-xl',
        lg: 'px-5 py-3 text-base rounded-xl',
        icon: 'h-9 w-9 p-0 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
