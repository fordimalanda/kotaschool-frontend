import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-brand-600 text-white shadow-soft-sm',
        secondary:
          'bg-slate-100 text-slate-700 hover:bg-slate-200/80',
        outline:
          'border border-slate-200 text-slate-700 bg-white shadow-soft-sm',
        success:
          'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        emerald:
          'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        warning:
          'bg-amber-50 text-amber-700 border border-amber-200/80',
        destructive:
          'bg-rose-50 text-rose-700 border border-rose-200/80',
        violet:
          'bg-violet-50 text-violet-700 border border-violet-200/80',
        sky:
          'bg-sky-50 text-sky-700 border border-sky-200/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
