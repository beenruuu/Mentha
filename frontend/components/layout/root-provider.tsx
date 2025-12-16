"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { DemoProvider } from "@/lib/demo-context";
import { DemoBanner } from "@/components/shared/demo-banner";

export function RootProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                retry: 1,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <DemoProvider>
                <DemoBanner />
                {children}
            </DemoProvider>
        </QueryClientProvider>
    );
}

