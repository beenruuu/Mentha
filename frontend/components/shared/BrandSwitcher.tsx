"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Plus, Trash2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTranslations } from "@/lib/i18n"
import { Brand } from "@/features/brand/api/brands"

interface BrandSwitcherProps {
    brands: Brand[]
    selectedBrand: Brand | null
    onSelect?: (brand: Brand) => void
    onDelete?: (brandId: string) => Promise<void>
    activeTab?: string,
    className?: string
}

export function BrandSwitcher({
    brands,
    selectedBrand,
    onSelect,
    onDelete,
    activeTab,
    className
}: BrandSwitcherProps) {
    const router = useRouter()
    const { t } = useTranslations()
    const [open, setOpen] = useState(false)
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)

    // If no brands, don't render anything or render skeleton
    if (!selectedBrand) return null

    const handleBrandSelect = (brand: Brand) => {
        setOpen(false)
        if (onSelect) {
            onSelect(brand)
        } else {
            // Navigate
            router.push(`/brand/${brand.id}${activeTab && activeTab !== 'overview' ? `?tab=${activeTab}` : ''}`)
        }
    }

    const handleNavigateToOnboarding = () => {
        setOpen(false)
        router.push('/onboarding')
    }

    const handleDeleteClick = (e: React.MouseEvent, brand: Brand) => {
        e.stopPropagation()
        setBrandToDelete(brand)
        setShowDeleteAlert(true)
    }

    const confirmDelete = async () => {
        if (brandToDelete && onDelete) {
            await onDelete(brandToDelete.id)
            setBrandToDelete(null)
            setShowDeleteAlert(false)
        }
    }

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 hover:border-primary/50 transition-colors text-sm font-medium group",
                            className
                        )}
                    >
                        <div className="w-6 h-6 rounded bg-gray-100 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${selectedBrand.domain}&sz=32`}
                                alt=""
                                className="w-4 h-4 object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{selectedBrand.name}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{selectedBrand.domain}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 p-0">
                    <div className="max-h-[300px] overflow-y-auto">
                        {brands.map((brand) => (
                            <div
                                key={brand.id}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors cursor-pointer group",
                                    brand.id === selectedBrand.id && "bg-primary/5 text-primary"
                                )}
                                onClick={() => handleBrandSelect(brand)}
                            >
                                <div className="flex-1 flex items-center gap-3 overflow-hidden">
                                    <div className="w-6 h-6 shrink-0 rounded bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=32`}
                                            alt=""
                                            className="w-4 h-4 object-contain"
                                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                                        />
                                    </div>
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <span className="font-medium truncate w-full">{brand.name}</span>
                                        <span className="text-xs text-muted-foreground truncate w-full">{brand.domain}</span>
                                    </div>
                                </div>

                                {onDelete && (
                                    <button
                                        onClick={(e) => handleDeleteClick(e, brand)}
                                        className="p-1 hover:bg-destructive/10 rounded-md transition-colors ml-2 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-border/50">
                        <button
                            onClick={handleNavigateToOnboarding}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {t.addBrand}
                        </button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {brandToDelete && t.deleteWarning.replace('{name}', brandToDelete.name)}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {t.delete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
