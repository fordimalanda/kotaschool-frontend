import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-soft-md shadow-brand-500/20',
        primary:
          'bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-soft-md shadow-brand-500/20',
        secondary:
          'bg-slate-100 text-slate-900 hover:bg-slate-200/80 shadow-soft-sm',
        outline:
          'border border-slate-200 bg-white text-slate-700 shadow-soft-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300',
        ghost:
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        destructive:
          'bg-rose-600 text-white shadow-sm hover:bg-rose-700 shadow-rose-500/20',
        success:
          'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 shadow-emerald-500/20',
        soft:
          'bg-brand-50 text-brand-700 hover:bg-brand-100/80 border border-brand-200/60',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-base font-semibold',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, asChild = false, children, disabled, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(
          buttonVariants({ variant, size, className }),
          (children.props as any)?.className
        ),
        ...props,
      });
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
