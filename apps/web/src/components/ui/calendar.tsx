"use client"

import * as React from "react"
import { IconChevronRight as ChevronRight } from "@/components/icons";
import { ChevronLeft } from "lucide-react";
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/cn"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "space-y-3",
        month_caption: "flex items-center justify-center pt-1 pb-2 relative",
        caption_label: "text-sm font-bold text-ink",
        dropdowns: "flex items-center gap-1.5",
        dropdown: "rounded-md border border-border bg-white px-1.5 py-1 text-sm font-medium text-ink dark:bg-gray-900",
        nav: "flex items-center justify-between absolute inset-x-0 top-1",
        button_previous: "h-7 w-7 flex items-center justify-center rounded-md text-muted hover:bg-gray-100 hover:text-ink dark:hover:bg-white/10",
        button_next: "h-7 w-7 flex items-center justify-center rounded-md text-muted hover:bg-gray-100 hover:text-ink dark:hover:bg-white/10",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-center text-xs font-semibold text-muted",
        week: "flex w-full mt-1",
        day: "h-9 w-9 text-center text-sm p-0 relative",
        day_button: "h-9 w-9 rounded-full font-medium text-ink hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors",
        today: "[&>button]:border [&>button]:border-violet-400",
        selected: "[&>button]:bg-violet-600 [&>button]:text-white [&>button]:hover:bg-violet-600",
        outside: "[&>button]:text-muted/40",
        disabled: "[&>button]:text-muted/30 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
