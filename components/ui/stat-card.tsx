import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  colorTheme?: 'brand' | 'emerald' | 'amber' | 'violet' | 'sky' | 'rose';
  className?: string;
}

const themeStyles = {
  brand: {
    iconBg: 'bg-brand-50 text-brand-600 border-brand-200/80',
    ring: 'hover:border-brand-300',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    ring: 'hover:border-emerald-300',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
    ring: 'hover:border-amber-300',
  },
  violet: {
    iconBg: 'bg-violet-50 text-violet-600 border-violet-200/80',
    ring: 'hover:border-violet-300',
  },
  sky: {
    iconBg: 'bg-sky-50 text-sky-600 border-sky-200/80',
    ring: 'hover:border-sky-300',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
    ring: 'hover:border-rose-300',
  },
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  trend,
  colorTheme = 'brand',
  className,
}: StatCardProps) {
  const theme = themeStyles[colorTheme];

  const content = (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-soft-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md',
        theme.ring,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </span>
          </div>
        </div>

        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-soft-sm transition-transform duration-200 group-hover:scale-105',
            theme.iconBg
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(description || trend || href) && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-medium',
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {trend.value}
              </span>
            )}
            <span>{description ?? trend?.label}</span>
          </div>

          {href && (
            <span className="inline-flex items-center gap-1 font-medium text-brand-600 group-hover:underline ml-auto">
              Voir
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
