import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

export function getStatusColor(status: string): { bg: string; text: string; border?: string } {
  const colors: Record<string, { bg: string; text: string; border?: string }> = {
    APROVADA: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    REJEITADA: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    EM_ANDAMENTO: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    AGUARDANDO_APROVACAO: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    ATIVO: { bg: "bg-emerald-50", text: "text-emerald-700" },
    INATIVO: { bg: "bg-slate-50", text: "text-slate-600" },
  };
  return colors[status] || { bg: "bg-slate-50", text: "text-slate-600" };
}

export function getPriorityColor(priority: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    CRITICA: { bg: "bg-rose-50", text: "text-rose-700" },
    ALTA: { bg: "bg-amber-50", text: "text-amber-700" },
    MEDIA: { bg: "bg-blue-50", text: "text-blue-700" },
    BAIXA: { bg: "bg-emerald-50", text: "text-emerald-700" },
  };
  return colors[priority] || { bg: "bg-slate-50", text: "text-slate-600" };
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}