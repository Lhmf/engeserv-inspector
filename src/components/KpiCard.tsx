import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: "border-slate-200 bg-white hover:border-brand/50",
  primary: "border-navy/20 bg-navy/5 hover:bg-navy/10",
  success: "border-emerald-200 bg-emerald-50 hover:border-emerald-300",
  warning: "border-amber-200 bg-amber-50 hover:border-amber-300",
  danger: "border-rose-200 bg-rose-50 hover:border-rose-300",
};

const variantIconStyles = {
  default: "text-navy",
  primary: "text-navy",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-rose-600",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
  onClick,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl p-5 transition-all duration-200",
        "border shadow-sm",
        variantStyles[variant],
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
          {trend && (
            <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trend.positive !== false ? "text-emerald-600" : "text-rose-600")}>
              <span className="flex items-center gap-0.5">
                {trend.positive !== false ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7v-18" /></svg>
                )}
                {Math.abs(trend.value).toLocaleString("pt-BR")} {trend.label}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("flex-shrink-0 p-2 rounded-lg bg-slate-100", variantIconStyles[variant])}>
            <Icon className="w-6 h-6" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}