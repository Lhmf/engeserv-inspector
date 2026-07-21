import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  progress?: {
    value: number;
    max: number;
    label: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = "bg-navy/10",
  iconColor = "text-navy",
  trend,
  progress,
  className,
}: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          {trend && (
            <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trend.positive !== false ? "text-emerald-600" : "text-rose-600")}>
              {trend.positive !== false ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7v-18" /></svg>
              )}
              {Math.abs(trend.value).toLocaleString("pt-BR")} {trend.label}
            </div>
          )}
          {progress && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">{progress.label}</span>
                <span className="font-medium text-slate-700">{Math.round((progress.value / progress.max) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (progress.value / progress.max) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("flex-shrink-0 p-3 rounded-xl", iconBg, iconColor)}>
            <Icon className="w-7 h-7" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </div>
  );
}