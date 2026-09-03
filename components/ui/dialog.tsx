'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxWidth = 'lg',
}: DialogProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    }
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div
        className={cn(
          'relative z-50 w-full overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200/80 animate-scale-in',
          maxWidthClasses,
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6 bg-slate-50/50">
            <div className="space-y-1 pr-4">
              {title && (
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-slate-500">{description}</p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="max-h-[80vh] overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
