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

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
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
                <td className="px-4 py-2 font-medium text-slate-700">{user.name}</td>
                <td className="px-4 py-2 text-slate-500">{user.email}</td>
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
