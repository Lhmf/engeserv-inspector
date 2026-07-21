"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, icon: Icon, iconPosition = "left", children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      default: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400",
      primary: "bg-navy text-white hover:bg-brand focus:ring-navy/50 shadow-sm",
      secondary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-600",
      outline: "border-2 border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 focus:ring-slate-400",
      ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400",
      danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : iconPosition === "left" && Icon ? (
          <Icon className="h-4 w-4" strokeWidth={2} />
        ) : null}
        {children}
        {!loading && iconPosition === "right" && Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
      </button>
    )
  }
);

Button.displayName = "Button";