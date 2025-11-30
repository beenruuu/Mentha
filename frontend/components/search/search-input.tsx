"use client"

import { Search, Command, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    onSearch: () => void
    placeholder?: string
    className?: string
}

export function SearchInput({ value, onChange, onSearch, placeholder = "Ask anything...", className }: SearchInputProps) {
    return (
        <div className={cn("relative group", className)}>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-white dark:bg-[#1E1E24] border border-border/40 rounded-2xl shadow-lg transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50">
                <Search className="w-5 h-5 text-muted-foreground ml-4" />
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                    placeholder={placeholder}
                    className="flex-1 border-none bg-transparent h-14 px-4 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50"
                />
                <div className="pr-2 flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 text-xs text-muted-foreground font-mono">
                        <Command className="w-3 h-3" />
                        <span>K</span>
                    </div>
                    <Button
                        size="icon"
                        onClick={onSearch}
                        className="h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
