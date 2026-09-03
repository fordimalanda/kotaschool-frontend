'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'pill',
}: TabsProps) {
  if (variant === 'underline') {
    return (
      <div className={cn('flex border-b border-slate-200 overflow-x-auto', className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-all duration-150 -mb-px',
                isActive
                  ? 'border-brand-600 text-brand-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              )}
            >
              {Icon && <Icon className={cn('h-4 w-4', isActive ? 'text-brand-600' : 'text-slate-400')} />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    isActive
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100/90 p-1 border border-slate-200/60 shadow-soft-sm',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-white text-brand-700 shadow-soft-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            )}
          >
            {Icon && <Icon className={cn('h-4 w-4', isActive ? 'text-brand-600' : 'text-slate-400')} />}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-xs font-semibold',
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'bg-slate-200/70 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
