"use client";

import { HTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { Button } from "./Button";

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href: string }[];
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(
  (
    {
      title,
      subtitle,
      breadcrumbs,
      actions,
      backHref,
      backLabel = "Voltar",
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <header
        ref={ref}
        className={`border-b border-slate-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-3 sticky top-0 z-10 ${className}`}
        {...props}
      >
        <div className="max-w-7xl mx-auto">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.href} className="flex items-center gap-1.5">
                  {index > 0 && (
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <Link
                    href={crumb.href}
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {crumb.label}
                  </Link>
                </span>
              ))}
            </nav>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              {backHref && (
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800 hidden sm:flex"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {backLabel}
                </Link>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:ml-auto">
              {actions && <div className="flex items-center gap-2">{actions}</div>}
              {backHref && (
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800 sm:hidden"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {backLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }
);

PageHeader.displayName = "PageHeader";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      title,
      description,
      icon,
      action,
      className = "",
      children,
      ...props
    },
    ref
  ) => (
    <section
      ref={ref}
      className={`space-y-4 ${className}`}
      {...props}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-navy" aria-hidden="true">{icon}</span>}
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {children}
    </section>
  )
);

Section.displayName = "Section";

export interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  href?: string;
}

export const KPICard = ({
  label,
  value,
  icon,
  iconBgColor,
  iconColor,
  trend,
  href,
}: KPICardProps) => {
  const content = (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {trend && (
            <p className={`text-xs font-medium mt-1 ${trend.positive ? "text-emerald-600" : "text-rose-600"}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center`}>
          <span className={`w-6 h-6 ${iconColor}`} aria-hidden="true">{icon}</span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group hover:shadow-md transition-shadow">
        {content}
      </Link>
    );
  }

  return content;
};