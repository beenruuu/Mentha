"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { fetchAPI } from "@/lib/api-client";

export function GoogleConnect() {
    // Check connection status
    const { data: status, isLoading, refetch } = useQuery({
        queryKey: ["gscStatus"],
        queryFn: async () => {
            // Fetch sites from Google Search Console API
            // Assuming for now if we can fetch sites, we are connected
            try {
                const sites = await fetchAPI<any[]>("/gsc/sites");
                return { connected: true, sites };
            } catch (e) {
                return { connected: false };
            }
        }
    });

    const handleConnect = () => {
        // Redirect to backend auth endpoint
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/gsc/auth`;
    };

    const handleSync = () => {
        toast.info("Sincronización iniciada en segundo plano...");
    }

    if (isLoading) return <div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

    return (
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                        {/* Google G Logo SVG */}
                        <svg viewBox="0 0 48 48" className="w-8 h-8">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                        <div>
                            <CardTitle className="text-lg">SEO Comparativo</CardTitle>
                            <CardDescription>Compara tu rendimiento en búsqueda tradicional vs IA.</CardDescription>
                        </div>
                    </div>
                    {status?.connected ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                            <CheckCircle className="w-3 h-3" /> Conectado
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-500 gap-1">
                            <AlertCircle className="w-3 h-3" /> Desconectado
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {status?.connected ? (
                    <div className="flex flex-col gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded text-sm text-slate-600 dark:text-slate-400">
                            Sincronizando datos para <strong>{status.sites?.length || 1} propiedades</strong>.
                        </div>
                        <Button variant="outline" size="sm" onClick={handleSync} className="w-fit">
                            <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar Ahora
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground">
                            Conecta tu cuenta para importar automáticamente palabras clave y detectar oportunidades de contenido basadas en tráfico real.
                        </p>
                        <Button onClick={handleConnect} className="w-fit bg-emerald-600 hover:bg-emerald-700 text-white">
                            Conectar cuenta de Google
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
