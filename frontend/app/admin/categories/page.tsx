'use client'

import { useEffect, useState } from 'react'
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Check,
  X,
  Palette
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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
import { AdminPageWrapper } from '@/components/admin/admin-page-wrapper'
import { adminService, type Category, type CategoryCreate, type CategoryUpdate } from '@/lib/services/admin'
import { toast } from 'sonner'
import { useTranslations } from '@/lib/i18n'

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6B7280'
]

const PRESET_ICONS = [
  'laptop', 'shopping-cart', 'dollar-sign', 'heart', 'book-open',
  'megaphone', 'home', 'play', 'plane', 'more-horizontal'
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  // Modal states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const { t } = useTranslations()

  // Form state
  const [formData, setFormData] = useState<CategoryCreate>({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    sort_order: 0
  })

  useEffect(() => {
    fetchCategories()
  }, [showInactive])

  const fetchCategories = async () => {
    try {
      const data = await adminService.getCategories(showInactive)
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error(t.errorLoadingCategories)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.slug) {
      toast.error(t.nameAndSlugRequired)
      return
    }

    setActionLoading(true)
    try {
      await adminService.createCategory(formData)
      toast.success(t.categoryCreatedSuccess)
      setShowCreateDialog(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      toast.error(t.errorCreatingCategory)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedCategory) return

    setActionLoading(true)
    try {
      const updateData: CategoryUpdate = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        sort_order: formData.sort_order
      }
      await adminService.updateCategory(selectedCategory.id, updateData)
      toast.success(t.categoryUpdatedSuccess)
      setShowEditDialog(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      toast.error(t.errorUpdatingCategory)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return

    setActionLoading(true)
    try {
      await adminService.deleteCategory(selectedCategory.id)
      toast.success(t.categoryDeletedSuccess)
      setShowDeleteDialog(false)
      setSelectedCategory(null)
      fetchCategories()
    } catch (error) {
      toast.error(t.errorDeletingCategory)
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleActive = async (category: Category) => {
    try {
      await adminService.updateCategory(category.id, { is_active: !category.is_active })
      toast.success(!category.is_active ? t.categoryActivated : t.categoryDeactivated)
      fetchCategories()
    } catch (error) {
      toast.error(t.errorUpdatingCategory)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      color: '#3B82F6',
      sort_order: 0
    })
    setSelectedCategory(null)
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#3B82F6',
      sort_order: category.sort_order
    })
    setShowEditDialog(true)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  return (
    <AdminPageWrapper
      title={t.adminCategories}
      subtitle={`${categories.length} ${t.categoriesCount}`}
      actions={
        <>
          <div className="hidden md:flex items-center gap-2 mr-2">
            <Switch
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <span className="text-sm text-gray-500">{t.inactive}</span>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="sm" className="h-8">
            <Plus className="mr-2 h-4 w-4" />
            {t.newCategory}
          </Button>
        </>
      }
    >
      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded" />
              </CardContent>
            </Card>
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Tags className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t.noCategories}
            </h3>
            <p className="text-gray-500 mb-4">
              {t.createFirstCategory}
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t.newCategoryTitle}
            </Button>
          </div>
        ) : (
          categories.map((category) => (
            <Card
              key={category.id}
              className={`border-0 shadow-sm transition-opacity ${!category.is_active ? 'opacity-60' : ''
                }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Tags className="h-5 w-5" style={{ color: category.color }} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500">/{category.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => {
                        setSelectedCategory(category)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {category.description && (
                  <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                    {category.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs text-gray-500">Orden: {category.sort_order}</span>
                  </div>

                  <Switch
                    checked={category.is_active}
                    onCheckedChange={() => handleToggleActive(category)}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>
              Crea una nueva categoría de industria
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: generateSlug(e.target.value)
                  })
                }}
                placeholder="Ej: Technology"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Ej: technology"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la categoría..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === color
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-transparent'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Orden</label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading ? 'Creando...' : 'Crear Categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la categoría
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === color
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-transparent'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Orden</label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={actionLoading}>
              {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La categoría "{selectedCategory?.name}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageWrapper>
  )
}
