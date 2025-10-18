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
import { TrendingUp, TrendingDown, Plus, Search } from 'lucide-react'

import { mockKeywordData } from '@/lib/mock-data'

export default function KeywordsPage() {
  const [keywords] = useState(mockKeywordData)

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 70) return 'text-red-600'
    if (difficulty >= 50) return 'text-orange-600'
    return 'text-green-600'
  }

  const getVisibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white dark:bg-black">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Keywords IA</h1>
          </div>
          <div className="flex-1" />
          <UserAvatarMenu />
        </header>

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">Keywords Trackeadas</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">24</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +3 desde el mes pasado
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">Visibilidad Promedio</CardDescription>
                <CardTitle className="text-3xl text-emerald-600">85%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +12% este mes
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">Top 3 Posiciones</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">8</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  33% de tus keywords
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">Mejoras Potenciales</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">12</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Oportunidades identificadas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Add */}
          <Card className="w-full bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Gestión de Keywords</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">
                    Rastrea el rendimiento de tus keywords en motores de IA
                  </CardDescription>
                </div>
                <Button className="ml-0 md:ml-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Keyword
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar keywords..." className="pl-10" />
                </div>
              </div>

              <div className="overflow-x-auto -mx-6 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden px-6 md:px-0">
                    <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Volumen</TableHead>
                    <TableHead>Dificultad</TableHead>
                    <TableHead>Visibilidad IA</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Modelos IA</TableHead>
                    <TableHead>Tendencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map((kw) => (
                    <TableRow key={kw.id}>
                      <TableCell className="font-medium">{kw.keyword}</TableCell>
                      <TableCell>{kw.volume.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={getDifficultyColor(kw.difficulty)}>
                          {kw.difficulty}/100
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getVisibilityColor(kw.aiVisibility)}>
                          {kw.aiVisibility}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={kw.position <= 3 ? 'default' : 'secondary'}>
                          #{kw.position}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {kw.mentions.chatgpt && (
                            <Badge variant="outline" className="text-xs">GPT</Badge>
                          )}
                          {kw.mentions.claude && (
                            <Badge variant="outline" className="text-xs">Claude</Badge>
                          )}
                          {kw.mentions.perplexity && (
                            <Badge variant="outline" className="text-xs">Perp</Badge>
                          )}
                          {kw.mentions.gemini && (
                            <Badge variant="outline" className="text-xs">Gemini</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {kw.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : kw.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <div className="h-4 w-4 border-t-2 border-gray-400" />
                        )}
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
