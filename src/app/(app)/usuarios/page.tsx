import { getSession, canCreateGestor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewUserForm } from "./NewUserForm";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN_MASTER: "Administrador Master",
  GESTOR: "Gestor",
  FUNCIONARIO: "Funcionario",
};

export default async function UsuariosPage() {
  const session = await getSession();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Usuarios</h1>
        <p className="text-sm text-slate-500">
          {session && canCreateGestor(session.role)
            ? "Como Administrador Master, voce pode criar contas de Gestor ou Funcionario."
            : "Como Gestor, voce pode criar contas de Funcionario."}
        </p>
      </div>

      <NewUserForm canCreateGestor={!!session && canCreateGestor(session.role)} />

      {/* Mobile cards (< md) */}
      <div className="space-y-3 md:hidden">
        {users.map((user: UserRow) => (
          <div key={user.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{user.name}</p>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-1 text-xs ${
                  user.active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                }`}
              >
                {user.active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-500">
            Nenhum usuário cadastrado.
          </div>
        )}
      </div>

      {/* Desktop table (md+) */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Papel</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user: UserRow) => (
              <tr key={user.id}>
                <td className="px-4 py-2 font-medium text-slate-700"><span className="block max-w-[180px] truncate">{user.name}</span></td>
                <td className="px-4 py-2 text-slate-500"><span className="block max-w-[240px] truncate">{user.email}</span></td>
                <td className="px-4 py-2 text-slate-500">{ROLE_LABEL[user.role] ?? user.role}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      user.active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {user.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
