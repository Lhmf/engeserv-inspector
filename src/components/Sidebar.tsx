import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Building2,
  Box,
  FileText,
  ClipboardCheck,
  Calendar,
  Settings,
  Users,
  ChevronRight,
  X,
  LayoutDashboard,
} from "lucide-react";
type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  rolesAllowed?: ("ADMIN_MASTER" | "GESTOR" | "FUNCIONARIO")[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/equipamentos", label: "Equipamentos", icon: Box },
  { href: "/inspecoes", label: "Inspeções", icon: ClipboardCheck },
  { href: "/laudos", label: "Laudos", icon: FileText },
  { href: "/validades", label: "Validades", icon: Calendar },
  { href: "/usuarios", label: "Usuários", icon: Users, rolesAllowed: ["ADMIN_MASTER", "GESTOR"] },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({ role, collapsed = false, onToggle, onCloseMobile, mobileOpen = false, userName, userEmail }: {
  role: "ADMIN_MASTER" | "GESTOR" | "FUNCIONARIO";
  collapsed?: boolean;
  onToggle?: () => void;
  onCloseMobile?: () => void;
  mobileOpen?: boolean;
  userName?: string;
  userEmail?: string;
}) {
  const items = NAV_ITEMS.filter((item) => !item.rolesAllowed || item.rolesAllowed.includes(role));
  // Mobile drawer always renders expanded (w-64). Desktop honors `collapsed`.
  const showFull = mobileOpen || !collapsed;

  return (
    <aside
      aria-hidden={!mobileOpen}
      className={cn(
        "fixed inset-y-0 left-0 z-50 border-r border-slate-800 bg-navy text-slate-100",
        "transition-all duration-300 ease-in-out",
        // Mobile: off-canvas drawer; closed translates off-screen, open slides in.
        // `invisible` removes hidden links from the tab order when closed.
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full invisible",
        // Tablet/desktop: always visible, honors collapsed width.
        "md:translate-x-0 md:shadow-none md:visible",
        collapsed ? "md:w-16" : "md:w-64",
        "md:shrink-0"
      )}
    >
      <div className={cn("flex items-center justify-between h-16 px-4 border-b border-slate-800", !showFull && "md:justify-center")}>
        {showFull && (
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="EngeServ Inspector">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-lg leading-tight">EngeServ</span>
          </Link>
        )}
        {!showFull && (
          <Link href="/dashboard" className="flex items-center justify-center" aria-label="EngeServ Inspector">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
        )}
        {/* Close (mobile) */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {/* Expand/Collapse (desktop) */}
        {showFull && onToggle && (
          <button
            onClick={onToggle}
            className="hidden md:inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Expandir menu"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className={cn("flex-1 overflow-y-auto px-3 py-4 space-y-1", !showFull && "md:items-center")}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onCloseMobile}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 min-h-11 rounded-xl text-sm font-medium transition-all duration-200",
              "text-slate-300 hover:text-white hover:bg-white/10",
              !showFull && "md:justify-center"
            )}
            title={!showFull ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} aria-hidden="true" />
            {showFull && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className={cn("p-4 border-t border-slate-800", !showFull && "md:hidden")}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">{userName || "Usuário"}</p>
            <p className="text-[10px] text-slate-500 truncate">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}