"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary";
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  illustration?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  secondaryAction,
  className,
  illustration,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-4", className)}>
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : Icon ? (
        <div className="mb-6 p-4 bg-slate-100 rounded-2xl">
          <Icon className="w-12 h-12 text-slate-400" strokeWidth={1.5} />
        </div>
      ) : null}

      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>

      {description && (
        <p className="text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        {action && (
          <a
            href={action.href}
            onClick={action.onClick}
            className={cn(
              "w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm transition-colors",
              action.variant === "secondary"
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-navy text-white hover:bg-brand"
            )}
          >
            {action.label}
          </a>
        )}

        {secondaryAction && (
          <a
            href={secondaryAction.href}
            onClick={secondaryAction.onClick}
            className="w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            {secondaryAction.label}
          </a>
        )}
      </div>
    </div>
  );
}