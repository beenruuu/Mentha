"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Home,
  Search,
  Bell,
  Settings,
  BarChart3,
  Sparkles,
  Keyboard,
  Moon,
  Sun,
} from "lucide-react"
import { useTranslations } from "@/lib/i18n"

interface Shortcut {
  name: string
  shortcut: string
  action: () => void
  icon?: React.ReactNode
  section: string
}

export function CommandPalette() {
  const { t } = useTranslations()
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  const shortcuts: Shortcut[] = [
    {
      name: t.cmdDashboard,
      shortcut: "Ctrl+D",
      action: () => router.push("/dashboard"),
      icon: <Home className="mr-2 h-4 w-4" />,
      section: t.cmdNavigation,
    },
    {
      name: t.cmdSearch,
      shortcut: "Ctrl+K",
      action: () => router.push("/search"),
      icon: <Search className="mr-2 h-4 w-4" />,
      section: t.cmdNavigation,
    },
    {
      name: t.cmdNotifications,
      shortcut: "Ctrl+N",
      action: () => router.push("/notifications"),
      icon: <Bell className="mr-2 h-4 w-4" />,
      section: t.cmdNavigation,
    },
    {
      name: t.cmdSettings,
      shortcut: "Ctrl+,",
      action: () => router.push("/settings"),
      icon: <Settings className="mr-2 h-4 w-4" />,
      section: t.cmdNavigation,
    },
    {
      name: t.cmdUpgrade,
      shortcut: "Ctrl+U",
      action: () => {
        // Dispatch global event to open upgrade modal
        window.dispatchEvent(new CustomEvent('open-upgrade-modal'))
      },
      icon: <Sparkles className="mr-2 h-4 w-4" />,
      section: t.cmdNavigation,
    },
    {
      name: t.cmdShortcuts,
      shortcut: "Ctrl+Y",
      action: () => setOpen(true),
      icon: <Keyboard className="mr-2 h-4 w-4" />,
      section: t.cmdHelp,
    },
    {
      name: t.cmdTheme,
      shortcut: "Ctrl+T",
      action: () => {
        // Esta acción se puede conectar con el theme-toggle
        const event = new KeyboardEvent("keydown", {
          key: "t",
          ctrlKey: true,
        })
        document.dispatchEvent(event)
      },
      icon: <Sun className="mr-2 h-4 w-4" />,
      section: t.cmdAppearance,
    },
  ]

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Abrir/cerrar paleta de comandos con Ctrl+Y o Cmd+Y
      if (e.key === "y" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        e.stopPropagation()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  // Agrupar atajos por sección
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.section]) {
      acc[shortcut.section] = []
    }
    acc[shortcut.section].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t.cmdPlaceholder} />
      <CommandList>
        <CommandEmpty>{t.cmdNoResults}</CommandEmpty>
        {Object.entries(groupedShortcuts).map(([section, items], idx) => (
          <React.Fragment key={section}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={section}>
              {items.map((shortcut) => (
                <CommandItem
                  key={shortcut.name}
                  onSelect={() => runCommand(shortcut.action)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    {shortcut.icon}
                    <span>{shortcut.name}</span>
                  </div>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    {shortcut.shortcut}
                  </kbd>
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
