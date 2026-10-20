"use client";

import { HTMLAttributes, forwardRef } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral" | "outline";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "default",
      size = "md",
      dot = false,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: "bg-navy/10 text-navy dark:bg-navy/20 dark:text-navy-300",
      success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      danger: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
      info: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      outline: "bg-transparent border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs gap-1",
      md: "px-2.5 py-1 text-xs gap-1.5",
      lg: "px-3 py-1.5 text-sm gap-2",
    };

    const baseStyles = "inline-flex items-center font-medium rounded-full transition-colors";

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {dot && (
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: "currentColor",
            }}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

// Fonte única de StatusBadge do portal (src/components/portal/StatusBadge.tsx).
// A implementação anterior duplicava rótulos/cores divergentes ("Regular",
// "Atenção") em relação ao componente central ("Em dia", "Próximo do
// vencimento"); agora apenas reexportamos o componente central para
// manter a API do barrel ui/index.
export { StatusBadge } from "../StatusBadge";