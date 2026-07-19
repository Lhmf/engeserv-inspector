import { LogoutButton } from "@/components/LogoutButton";

const ROLE_LABEL: Record<string, string> = {
  ADMIN_MASTER: "Administrador Master",
  GESTOR: "Gestor",
  FUNCIONARIO: "Funcionario",
};

export function TopBar({ name, role }: { name: string; role: string }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">{name}</p>
        <p className="text-xs text-slate-500">{ROLE_LABEL[role] ?? role}</p>
      </div>
      <LogoutButton />
    </header>
  );
}
