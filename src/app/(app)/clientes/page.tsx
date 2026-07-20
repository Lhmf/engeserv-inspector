import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewClientForm from "./NewClientForm";

export default async function ClientesPage() {
  const session = await getSession();

  const clientes = await prisma.client.findMany({
    select: {
      id: true,
      companyName: true,
      cnpj: true,
      responsible: { select: { id: true, name: true, email: true } },
      _count: { select: { equipments: true } },
      createdAt: true,
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500">Cadastro e gestão de clientes</p>
        </div>
        <a
          href="/clientes/novo"
          className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand"
        >
          Novo cliente
        </a>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">CNPJ</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3">Equipamentos</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">
                  {cliente.companyName}
                </td>
                <td className="px-4 py-3 text-slate-500">{cliente.cnpj ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">
                  {cliente.responsible?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {cliente._count.equipments}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(cliente.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      cliente.active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {cliente.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientes.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">
            Nenhum cliente cadastrado.
            <a
              href="/clientes/novo"
              className="ml-2 text-brand hover:underline"
            >
              Cadastrar o primeiro
            </a>
          </div>
        )}
      </div>
    </div>
  );
}