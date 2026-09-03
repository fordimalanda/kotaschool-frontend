import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const colorPairs = [
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-teal-100 text-teal-700 border-teal-200',
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPairs.length;
  return colorPairs[index];
}

export function Avatar({ name, src, size = 'md', className, ...props }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-14 w-14 text-lg',
  }[size];

  const initials = getInitials(name);
  const colorClass = getColorForName(name);

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold border select-none shadow-soft-sm',
        sizeClasses,
        colorClass,
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
