'use client';

import type React from 'react';
import { createContext, use } from 'react';

interface PromptContextProps {
    value: string;
    onValueChange: (v: string) => void;
    isLoading?: boolean;
    onSubmit?: (e?: React.FormEvent) => void;
}

const PromptInputContext = createContext<PromptContextProps | null>(null);

function usePromptInput() {
    const context = use(PromptInputContext);
    if (context === null) {
        throw new Error('usePromptInput must be used within a PromptInput');
    }
    return context;
}

export function PromptInput({
    value,
    onValueChange,
    isLoading,
    onSubmit,
    className,
    children,
}: React.PropsWithChildren<{
    value: string;
    onValueChange: (v: string) => void;
    isLoading?: boolean;
    onSubmit?: (e?: React.FormEvent) => void;
    className?: string;
}>) {
    return (
        <PromptInputContext.Provider value={{ value, onValueChange, isLoading, onSubmit }}>
            <form action={onSubmit} className={className}>
                {children}
            </form>
        </PromptInputContext.Provider>
    );
}

export function PromptInputTextarea({
    placeholder,
    className,
}: {
    placeholder?: string;
    className?: string;
}) {
    const ctx = usePromptInput();

    return (
        <textarea
            value={ctx.value}
            onChange={(e) => ctx.onValueChange(e.target.value)}
            placeholder={placeholder}
            className={className}
        />
    );
}

export function PromptInputActions({
    children,
    className,
}: {
    children?: React.ReactNode;
    className?: string;
}) {
    return <div className={className}>{children}</div>;
}

export function PromptInputAction({
    children,
    tooltip,
}: {
    children?: React.ReactNode;
    tooltip?: string;
}) {
    return <div title={tooltip}>{children}</div>;
}

export default PromptInput;
