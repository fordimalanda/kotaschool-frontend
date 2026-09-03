import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  requiredIndicator?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, requiredIndicator, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-xs font-semibold text-slate-700 tracking-wide select-none inline-flex items-center gap-1',
        className
      )}
      {...props}
    >
      {children}
      {requiredIndicator && <span className="text-rose-500 font-bold">*</span>}
    </label>
  )
);
Label.displayName = 'Label';

export { Label };
