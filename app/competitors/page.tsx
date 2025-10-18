'use client'

import { useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { UserAvatarMenu } from '@/components/user-avatar-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Plus, Search, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

import { mockCompetitorData } from '@/lib/mock-data'

export default function CompetitorsPage() {
  const [competitors] = useState(mockCompetitorData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [competitorName, setCompetitorName] = useState('')
  const [competitorDomain, setCompetitorDomain] = useState('')
  const { toast } = useToast()

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  const handleAddCompetitor = () => {
    if (!competitorName.trim() || !competitorDomain.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Competidor agregado',
      description: `${competitorName} se agregó a tu lista de competidores`,
    })
    
    setCompetitorName('')
    setCompetitorDomain('')
    setIsDialogOpen(false)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white dark:bg-black">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Análisis de Competencia</h1>
          </div>
          <div className="flex-1" />
          <UserAvatarMenu />
        </header>

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">Competidores Trackeados</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">8</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  En tu industria
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">Tu Posición</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">#5</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-emerald-600">
                  Subiste 2 posiciones
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">Gap de Visibilidad</CardDescription>
                <CardTitle className="text-3xl text-orange-600">-12%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  vs. líder del sector
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">Oportunidades</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">23</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Keywords para mejorar
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Competitor Comparison */}
          <Card className="w-full bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Comparativa de Competidores</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">
                    Analiza tu rendimiento frente a la competencia en motores de IA
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Competidor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar Nuevo Competidor</DialogTitle>
                      <DialogDescription>
                        Ingresa los datos del competidor que deseas analizar
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nombre del Competidor</Label>
                        <Input
                          id="name"
                          placeholder="Ej: Empresa XYZ"
                          value={competitorName}
                          onChange={(e) => setCompetitorName(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="domain">Dominio</Label>
                        <Input
                          id="domain"
                          placeholder="Ej: empresaxyz.com"
                          value={competitorDomain}
                          onChange={(e) => setCompetitorDomain(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddCompetitor}>
                        Agregar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar competidores..." className="pl-10" />
                </div>
              </div>

              <div className="overflow-x-auto -mx-6 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden px-6 md:px-0">
                    <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competidor</TableHead>
                    <TableHead>Dominio</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Visibilidad
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Menciones IA</TableHead>
                    <TableHead>Pos. Promedio</TableHead>
                    <TableHead>Tendencia</TableHead>
                    <TableHead>Fortalezas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell className="font-medium">{comp.name}</TableCell>
                      <TableCell className="text-muted-foreground">{comp.domain}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className={`font-semibold ${getScoreColor(comp.visibilityScore)}`}>
                            {comp.visibilityScore}/100
                          </div>
                          <Progress value={comp.visibilityScore} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell>{comp.mentions}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">#{comp.avgPosition}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {comp.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : comp.trend === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <div className="h-4 w-4 border-t-2 border-gray-400" />
                          )}
                          <span className={
                            comp.trend === 'up' ? 'text-green-600' :
                            comp.trend === 'down' ? 'text-red-600' :
                            'text-gray-600'
                          }>
                            {comp.change}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {comp.strengths.slice(0, 2).map((strength, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {strength}
                            </Badge>
                          ))}
                          {comp.strengths.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{comp.strengths.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gap Analysis */}
          <Card className="w-full bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Análisis de Brechas</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Identifica áreas donde los competidores te superan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Calidad de Contenido</span>
                    <span className="text-sm text-muted-foreground">Ellos: 92% | Tú: 78%</span>
                  </div>
                  <div className="flex gap-2">
                    <Progress value={92} className="h-2 flex-1" />
                    <Progress value={78} className="h-2 flex-1 opacity-50" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Autoridad de Dominio</span>
                    <span className="text-sm text-muted-foreground">Ellos: 88% | Tú: 72%</span>
                  </div>
                  <div className="flex gap-2">
                    <Progress value={88} className="h-2 flex-1" />
                    <Progress value={72} className="h-2 flex-1 opacity-50" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Cobertura de Keywords</span>
                    <span className="text-sm text-muted-foreground">Ellos: 85% | Tú: 91%</span>
                  </div>
                  <div className="flex gap-2">
                    <Progress value={85} className="h-2 flex-1" />
                    <Progress value={91} className="h-2 flex-1 opacity-50" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
