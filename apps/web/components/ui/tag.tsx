import type React from 'react';

import { cn } from '@/lib/utils';

interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const Tag: React.FC<TagProps> = ({ children, className, ...props }) => (
    <div
        className={cn(
            'inline-block px-3 py-1 rounded-full bg-mentha-mint/10 text-mentha-forest text-xs font-mono uppercase tracking-widest',
            className,
        )}
        {...props}
    >
        {children}
    </div>
);

export default Tag;
