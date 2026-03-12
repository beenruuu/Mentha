'use client';

import type React from 'react';

import { cn } from '@/lib/utils';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export function Table({ className, children, ...props }: TableProps) {
    return (
        <div className="w-full overflow-auto rounded-xl border border-mentha-forest/10 dark:border-mentha-beige/10">
            <table className={cn('w-full caption-bottom text-sm', className)} {...props}>
                {children}
            </table>
        </div>
    );
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableHeader({ className, children, ...props }: TableHeaderProps) {
    return (
        <thead
            className={cn(
                'border-b border-mentha-forest/10 dark:border-mentha-beige/10 bg-mentha-forest/[0.02] dark:bg-white/[0.02]',
                className,
            )}
            {...props}
        >
            {children}
        </thead>
    );
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, children, ...props }: TableBodyProps) {
    return (
        <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}>
            {children}
        </tbody>
    );
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    isClickable?: boolean;
}

export function TableRow({ className, isClickable, children, ...props }: TableRowProps) {
    return (
        <tr
            className={cn(
                'border-b border-mentha-forest/10 dark:border-mentha-beige/10 transition-colors',
                isClickable && 'cursor-pointer hover:bg-mentha-forest/5 dark:hover:bg-white/5',
                className,
            )}
            {...props}
        >
            {children}
        </tr>
    );
}

interface TableHeadProps extends React.HTMLAttributes<HTMLTableCellElement> {}

export function TableHead({ className, children, ...props }: TableHeadProps) {
    return (
        <th
            className={cn(
                'h-12 px-4 text-left align-middle font-mono text-xs uppercase tracking-widest text-mentha-forest/50 dark:text-mentha-beige/50 font-medium',
                className,
            )}
            {...props}
        >
            {children}
        </th>
    );
}

interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {}

export function TableCell({ className, children, ...props }: TableCellProps) {
    return (
        <td
            className={cn('p-4 align-middle text-mentha-forest dark:text-mentha-beige', className)}
            {...props}
        >
            {children}
        </td>
    );
}
