import { clsx, type ClassValue } from "clsx";
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

export function getStatusColor(status: string): { bg: string; text: string; border?: string; dot?: string } {
  const colors: Record<string, { bg: string; text: string; border?: string; dot?: string }> = {
    APROVADA: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    REJEITADA: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
    EM_ANDAMENTO: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
    AGUARDANDO_APROVACAO: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    ATIVO: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    INATIVO: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
    CRITICO: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
    ATENCAO: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    OK: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  };
  return colors[status] || { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
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

export function getEquipmentTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    CALDEIRA: "🔥",
    VASO_DE_PRESSAO: "⚡",
    TANQUE: "🛢️",
    SILO: "🏭",
    TUBULACAO: "🔗",
    COMPRESSOR: "💨",
    TROCADOR_DE_CALOR: "♨️",
    REATOR: "⚗️",
    OUTRO: "📦",
  };
  return icons[type] || "📦";
}

export function getEquipmentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    CALDEIRA: "Caldeira",
    VASO_DE_PRESSAO: "Vaso de Pressão",
    TANQUE: "Tanque",
    SILO: "Silo",
    TUBULACAO: "Tubulação",
    COMPRESSOR: "Compressor",
    TROCADOR_DE_CALOR: "Trocador de Calor",
    REATOR: "Reator",
    OUTRO: "Outro",
  };
  return labels[type] || type;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora mesmo";
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return formatDate(date);
}