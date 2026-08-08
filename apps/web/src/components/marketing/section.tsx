import React from "react";
import { Grain } from "./grain";
import { cn } from "@/lib/cn";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  variant?: "default" | "grain";
  containerClassName?: string;
}

export function Section({
  children,
  variant = "default",
  className,
  containerClassName,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("relative w-full py-16 md:py-24", className)}
      {...props}
    >
      {variant === "grain" && <Grain />}
      <div
        className={cn(
          "container relative z-10 mx-auto px-4 sm:px-6 lg:px-8",
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
