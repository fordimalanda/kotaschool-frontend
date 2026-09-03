import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 sm:p-12 text-center animate-fade-in',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200/80 text-slate-400 shadow-soft-sm mb-4">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-500 leading-relaxed">
        {description}
      </p>
      {action && (
        <Button
          onClick={action.onClick}
          size="sm"
          className="mt-5"
          variant="default"
        >
          {ActionIcon && <ActionIcon className="mr-1.5 h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
