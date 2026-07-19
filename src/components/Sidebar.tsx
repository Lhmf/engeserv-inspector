import Link from "next/link";
import type { Role } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  // se definido, o item so aparece para esses papeis
  rolesAllowed?: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/equipamentos", label: "Equipamentos" },
  { href: "/inspecoes", label: "Inspecoes" },
  { href: "/laudos", label: "Laudos" },
  { href: "/validades", label: "Validades" },
  { href: "/usuarios", label: "Usuarios", rolesAllowed: ["ADMIN_MASTER", "GESTOR"] },
  { href: "/configuracoes", label: "Configuracoes" },
];

export function Sidebar({ role }: { role: Role }) {
  const items = NAV_ITEMS.filter((item) => !item.rolesAllowed || item.rolesAllowed.includes(role));

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-navy text-slate-100 md:flex md:flex-col">
      <div className="px-5 py-6">
        <p className="text-lg font-bold leading-tight">EngeServ</p>
        <p className="text-xs text-slate-300">Inspector</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-5 py-4 text-xs text-slate-400">
        MVP 1.0 — Sprint 1
      </div>
    </aside>
  );
}
