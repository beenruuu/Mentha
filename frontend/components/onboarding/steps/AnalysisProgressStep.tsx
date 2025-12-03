'use client'

import { useEffect, useState } from 'react'
import { useOnboarding } from '@/lib/context/onboarding-context'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/lib/i18n'

interface Task {
    id: string
    label: string
    labelEs: string
    status: 'pending' | 'running' | 'completed'
}

const TASKS: Task[] = [
    { id: 'brand', label: 'Creating brand profile...', labelEs: 'Creando perfil de marca...', status: 'pending' },
    { id: 'prompts', label: 'Setting up prompts...', labelEs: 'Configurando prompts...', status: 'pending' },
    { id: 'providers', label: 'Connecting AI providers...', labelEs: 'Conectando proveedores de IA...', status: 'pending' },
    { id: 'analysis', label: 'Starting initial analysis...', labelEs: 'Iniciando análisis inicial...', status: 'pending' },
]

export default function AnalysisProgressStep() {
    const router = useRouter()
    const { lang } = useTranslations()
    const [tasks, setTasks] = useState<Task[]>(TASKS)
    const [progress, setProgress] = useState(0)

    const t = {
        title: lang === 'es' ? 'Configurando tu cuenta' : 'Setting up your account',
        subtitle: lang === 'es' ? 'Esto solo tomará unos segundos' : 'This will only take a few seconds',
    }

    useEffect(() => {
        let taskIndex = 0

        const runTasks = async () => {
            for (let i = 0; i < TASKS.length; i++) {
                // Set task to running
                setTasks((prev) =>
                    prev.map((t, idx) => (idx === i ? { ...t, status: 'running' } : t))
                )
                // Simulate work
                await new Promise((resolve) => setTimeout(resolve, 800))
                // Set task to completed
                setTasks((prev) =>
                    prev.map((t, idx) => (idx === i ? { ...t, status: 'completed' } : t))
                )
                setProgress(((i + 1) / TASKS.length) * 100)
            }
            // Redirect to dashboard after completion
            await new Promise((resolve) => setTimeout(resolve, 500))
            router.push('/dashboard')
        }

        runTasks()
    }, [router])

    return (
        <div className="space-y-8">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            <Progress value={progress} className="h-2" />

            <div className="space-y-3">
                {tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3">
                        {task.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : task.status === 'running' ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted" />
                        )}
                        <span
                            className={
                                task.status === 'completed'
                                    ? 'text-muted-foreground'
                                    : task.status === 'running'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground/50'
                            }
                        >
                            {lang === 'es' ? task.labelEs : task.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
