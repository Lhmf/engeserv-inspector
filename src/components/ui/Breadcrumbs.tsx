"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

export function Breadcrumbs({ items, className, separator = <ChevronRight className="w-4 h-4 text-slate-400" /> }: BreadcrumbsProps) {
  return (
    <nav className={cn("flex items-center gap-1.5 text-sm", className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors">
            <Home className="w-4 h-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index < items.length - 1 && <span className="text-slate-300" aria-hidden="true">{separator}</span>}
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 transition-colors",
                  index === items.length - 1 ? "text-slate-800 font-medium" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-800 font-medium" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}