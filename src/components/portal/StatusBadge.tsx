"use client";

import { ReactNode } from "react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const classes = [
    "px-2 py-1 rounded-full text-xs font-medium transition-colors",
    status === "OK" && "bg-emerald-50 text-emerald-700",
    status === "PROXIMO" && "bg-amber-50 text-amber-700",
    status === "VENCIDO" && "bg-rose-50 text-rose-700",
    status === "SEM_DATA" && "bg-gray-200 text-gray-600",
    className,
  ].filter(Boolean).join(" ");

  return (
    <span className={classes}>{status}</span>
  );
}