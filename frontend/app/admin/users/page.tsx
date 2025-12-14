'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  MoreHorizontal,
  User,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckCircle,
  Trash2,
  Eye,
  Building2,
  Globe,
  Briefcase,
  CreditCard
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPageWrapper } from '@/components/admin/admin-page-wrapper'
import { getCountryCode, getCountryName } from '@/lib/utils/countries'
import FlagIcon from '@/components/shared/flag-icon'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { adminService, type UserListItem, type UserDetail, type PaginatedUsers, type UserFilters } from '@/lib/services/admin'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { toast } from 'sonner'
import { useTranslations } from '@/lib/i18n'

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<PaginatedUsers | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  // Modals
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [showUserDetail, setShowUserDetail] = useState(false)
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [actionUser, setActionUser] = useState<UserListItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const { t, lang } = useTranslations()
  const dateLocale = lang === 'es' ? es : enUS

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminService.getUsers(filters)
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(t.errorLoadingUsers)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }))
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value, page: 1 }))
  }

  const handleViewUser = async (user: UserListItem) => {
    try {
      const detail = await adminService.getUserDetail(user.id)
      setSelectedUser(detail)
      setShowUserDetail(true)
    } catch (error) {
      toast.error(t.errorLoadingUserDetails)
    }
  }

  const handleSuspendUser = async () => {
    if (!actionUser || !suspendReason.trim()) return

    setActionLoading(true)
    try {
      await adminService.suspendUser(actionUser.id, suspendReason)
      toast.success(t.userSuspendedSuccess)
      setShowSuspendDialog(false)
      setSuspendReason('')
      setActionUser(null)
      fetchUsers()
    } catch (error) {
      toast.error(t.errorSuspendingUser)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnsuspendUser = async (user: UserListItem) => {
    try {
      await adminService.unsuspendUser(user.id)
      toast.success(t.userReactivatedSuccess)
      fetchUsers()
    } catch (error) {
      toast.error(t.errorReactivatingUser)
    }
  }

  const handleDeleteUser = async () => {
    if (!actionUser) return

    setActionLoading(true)
    try {
      await adminService.deleteUser(actionUser.id)
      toast.success(t.userDeletedSuccess)
      setShowDeleteDialog(false)
      setActionUser(null)
      fetchUsers()
    } catch (error) {
      toast.error(t.errorDeletingUser)
    } finally {
      setActionLoading(false)
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'pro': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'starter': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <AdminPageWrapper title={t.adminUserManagement} subtitle={`${users?.total || 0} ${t.adminUsers}`}>
      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t.searchByEmailOrName}
                  className="pl-9"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <Select onValueChange={(v) => handleFilterChange('plan', v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t.plan} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(v) => handleFilterChange('is_suspended', v === 'true' ? true : v === 'false' ? false : undefined)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t.state} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="false">{t.actives}</SelectItem>
                <SelectItem value="true">{t.suspended}</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(v) => handleFilterChange('sort_by', v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t.sortBy} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">{t.registrationDate}</SelectItem>
                <SelectItem value="last_login_at">{t.lastLogin}</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="w-[300px]">{t.userColumn}</TableHead>
                <TableHead>{t.plan}</TableHead>
                <TableHead>{t.brandsColumn}</TableHead>
                <TableHead>{t.country}</TableHead>
                <TableHead>{t.registration}</TableHead>
                <TableHead>{t.lastLogin}</TableHead>
                <TableHead>{t.state}</TableHead>
                <TableHead className="text-right">{t.actionsColumn}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users?.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {t.noUsersFound}
                  </TableCell>
                </TableRow>
              ) : (
                users?.users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.full_name || t.noName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanBadgeColor(user.plan)}>
                        {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {user.brands_count}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {user.country ? (
                        <span className="inline-flex items-center gap-1.5">
                          <FlagIcon code={getCountryCode(user.country) || 'XX'} size={18} />
                          <span>{getCountryName(user.country)}</span>
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {format(new Date(user.created_at), 'dd MMM yyyy', { locale: dateLocale })}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {user.last_login_at
                        ? format(new Date(user.last_login_at), 'dd MMM yyyy', { locale: dateLocale })
                        : t.never}
                    </TableCell>
                    <TableCell>
                      {user.is_suspended ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {t.suspendedStatus}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {t.activeStatus}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t.actionsColumn}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t.viewDetails}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.is_suspended ? (
                            <DropdownMenuItem onClick={() => handleUnsuspendUser(user)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {t.reactivateAccount}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setActionUser(user)
                                setShowSuspendDialog(true)
                              }}
                              className="text-amber-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              {t.suspend}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setActionUser(user)
                              setShowDeleteDialog(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t.remove}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {users && users.total_pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500">
                {t.showing} {((filters.page || 1) - 1) * (filters.limit || 20) + 1} {t.to}{' '}
                {Math.min((filters.page || 1) * (filters.limit || 20), users.total)} {t.ofTotal} {users.total} {t.usersLabel}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t.page} {filters.page} {t.ofPages} {users.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === users.total_pages}
                  onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.userDetails}</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="text-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                    {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedUser.full_name || t.noName}
                  </h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getPlanBadgeColor(selectedUser.plan)}>
                      {selectedUser.plan}
                    </Badge>
                    {selectedUser.is_suspended && (
                      <Badge variant="destructive">{t.suspendedStatus}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> {t.company}
                  </p>
                  <p className="font-medium">{selectedUser.company_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> {t.industry}
                  </p>
                  <p className="font-medium">{selectedUser.industry || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Globe className="h-4 w-4" /> {t.country}
                  </p>
                  <p className="font-medium">
                    {selectedUser.country ? (
                      <span className="inline-flex items-center gap-1.5">
                        <FlagIcon code={getCountryCode(selectedUser.country) || 'XX'} size={18} />
                        <span>{getCountryName(selectedUser.country)}</span>
                      </span>
                    ) : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <User className="h-4 w-4" /> {t.role}
                  </p>
                  <p className="font-medium">{selectedUser.role || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> {t.registration}
                  </p>
                  <p className="font-medium">
                    {format(new Date(selectedUser.created_at), 'PPP', { locale: dateLocale })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Stripe ID
                  </p>
                  <p className="font-medium font-mono text-xs">
                    {selectedUser.stripe_customer_id || '-'}
                  </p>
                </div>
              </div>

              {/* Onboarding Status */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="font-medium mb-2">{t.onboardingStatus}</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${(selectedUser.onboarding_step / 7) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">
                    {selectedUser.onboarding_completed ? t.completed : `${t.step} ${selectedUser.onboarding_step}/7`}
                  </span>
                </div>
              </div>

              {/* Brands */}
              {selectedUser.brands.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">{t.brandsLabel} ({selectedUser.brands.length})</h4>
                  <div className="space-y-2">
                    {selectedUser.brands.map((brand) => (
                      <div
                        key={brand.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=32`}
                            alt=""
                            className="w-6 h-6 rounded"
                          />
                          <div>
                            <p className="font-medium">{brand.name}</p>
                            <p className="text-sm text-gray-500">{brand.domain}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.suspendUser}</DialogTitle>
            <DialogDescription>
              {t.suspendUserDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.suspendReason}
              </label>
              <Textarea
                placeholder={t.suspendReasonPlaceholder}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendUser}
              disabled={!suspendReason.trim() || actionLoading}
            >
              {actionLoading ? t.suspending : t.suspendUser}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteUserPermanently}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteUserWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading ? t.deleting : t.deleteUser}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AdminPageWrapper>
  )
}
