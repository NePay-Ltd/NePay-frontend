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
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
