"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format, subDays, subMonths } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useTranslations } from "@/lib/i18n"

interface DatePickerWithRangeProps {
    className?: string
    date?: DateRange
    onDateChange?: (date: DateRange | undefined) => void
    onDaysChange?: (days: number) => void
}

export function DateRangePicker({
    className,
    date,
    onDateChange,
    onDaysChange
}: DatePickerWithRangeProps) {
    const { t } = useTranslations() // Ideally we would add translations for presets
    const [isOpen, setIsOpen] = React.useState(false)

    // Presets mapping
    const presets = [
        { label: "Last 7 days", days: 7 },
        { label: "Last 30 days", days: 30 },
        { label: "Last 90 days", days: 90 },
        { label: "Last year", days: 365 },
    ]

    const handlePresetClick = (days: number) => {
        const today = new Date()
        const from = subDays(today, days)
        const newRange = { from, to: today }

        // Call callbacks
        onDateChange?.(newRange)
        onDaysChange?.(days)
        setIsOpen(false)
    }

    // If no date provided, default to last 30 days internally for display if needed
    // but better to control from parent.

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[240px] justify-start text-left font-normal bg-white dark:bg-[#09090b] border-border/60 hover:bg-accent/50",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex">
                        {/* Presets Sidebar */}
                        <div className="border-r border-border p-2 space-y-1 min-w-[140px]">
                            <div className="text-xs font-medium text-muted-foreground px-2 py-1.5 mb-1 uppercase tracking-wider">
                                Presets
                            </div>
                            {presets.map((preset) => (
                                <button
                                    key={preset.days}
                                    onClick={() => handlePresetClick(preset.days)}
                                    className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Calendar */}
                        <div className="p-0">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={onDateChange}
                                numberOfMonths={2}
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
