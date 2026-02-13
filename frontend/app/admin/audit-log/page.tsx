'use client'

import { useEffect, useState } from 'react'
import {
  FileText,
  User,
  Calendar,
  Shield,
  Eye,
  Filter,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Trash2,
  Ban,
  UserPlus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { AdminPageWrapper } from '@/components/admin/admin-page-wrapper'
import { adminService, type AuditLogEntry } from '@/features/admin/api/admin'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const ACTION_ICONS: Record<string, React.ElementType> = {
  update_user: Pencil,
  delete_user: Trash2,
  suspend_user: Ban,
  unsuspend_user: CheckCircle2,
  create_category: UserPlus,
  update_category: Pencil,
  delete_category: Trash2,
  create_admin: Shield
}

const ACTION_COLORS: Record<string, string> = {
  update_user: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  delete_user: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  suspend_user: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  unsuspend_user: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  create_category: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  update_category: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  delete_category: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  create_admin: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
}

const ACTION_LABELS: Record<string, string> = {
  update_user: 'Usuario actualizado',
  delete_user: 'Usuario eliminado',
  suspend_user: 'Usuario suspendido',
  unsuspend_user: 'Usuario reactivado',
  create_category: 'Categoría creada',
  update_category: 'Categoría actualizada',
  delete_category: 'Categoría eliminada',
  create_admin: 'Admin creado'
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await adminService.getAuditLog(100)
        setLogs(data)
      } catch (error) {
        console.error('Error fetching audit logs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedLogs)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedLogs(newSet)
  }

  const filteredLogs = filterAction === 'all'
    ? logs
    : logs.filter(log => log.action === filterAction)

  const uniqueActions = [...new Set(logs.map(log => log.action))]

  return (
    <AdminPageWrapper 
      title="Audit Log" 
      subtitle={`${logs.length} acciones`}
      actions={
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[180px] h-8 text-xs bg-white dark:bg-[#1E1E24]">
            <Filter className="mr-2 h-3.5 w-3.5" />
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {ACTION_LABELS[action] || action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <FileText className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {logs.length}
                </p>
                <p className="text-sm text-gray-500">Total acciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Ban className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {logs.filter(l => l.action === 'suspend_user').length}
                </p>
                <p className="text-sm text-gray-500">Suspensiones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {logs.filter(l => l.action.includes('delete')).length}
                </p>
                <p className="text-sm text-gray-500">Eliminaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                <Pencil className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {logs.filter(l => l.action.includes('update')).length}
                </p>
                <p className="text-sm text-gray-500">Actualizaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log List */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto" />
              <p className="mt-4 text-gray-500">Cargando logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay registros
              </h3>
              <p className="text-gray-500">
                No se encontraron acciones en el audit log
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredLogs.map((log) => {
                const Icon = ACTION_ICONS[log.action] || FileText
                const colorClass = ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'
                const label = ACTION_LABELS[log.action] || log.action
                const isExpanded = expandedLogs.has(log.id)
                const hasDetails = log.old_values || log.new_values

                return (
                  <Collapsible
                    key={log.id}
                    open={isExpanded}
                    onOpenChange={() => hasDetails && toggleExpanded(log.id)}
                  >
                    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${colorClass.split(' ')[0]}`}>
                            <Icon className={`h-5 w-5 ${colorClass.split(' ').slice(1).join(' ')}`} />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={colorClass}>
                                {label}
                              </Badge>
                              {log.target_type && (
                                <span className="text-sm text-gray-500">
                                  en {log.target_type}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Shield className="h-3.5 w-3.5" />
                                {log.admin_email || 'Admin'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDistanceToNow(new Date(log.created_at), {
                                  addSuffix: true,
                                  locale: es
                                })}
                              </span>
                              {log.ip_address && (
                                <span className="text-xs font-mono">
                                  IP: {log.ip_address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {hasDetails && (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Detalles
                              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </div>

                      <CollapsibleContent>
                        <div className="mt-4 ml-14 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {log.old_values && Object.keys(log.old_values).length > 0 && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                              <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                                Valores anteriores
                              </h4>
                              <pre className="text-xs text-red-600 dark:text-red-300 overflow-auto">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          {log.new_values && Object.keys(log.new_values).length > 0 && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                              <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                                Valores nuevos
                              </h4>
                              <pre className="text-xs text-green-600 dark:text-green-300 overflow-auto">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageWrapper>
  )
}
