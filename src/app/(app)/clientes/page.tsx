import Link from "next/link";
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
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500">Cadastro e gestão de clientes</p>
        </div>
        <Link
          href="/clientes/novo"
          className="w-full sm:w-auto text-center rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand"
        >
          Novo cliente
        </Link>
      </div>

      <NewClientForm />

      {/* Mobile cards (< md) */}
      <div className="space-y-3 md:hidden">
        {clientes.map((cliente) => (
          <div
            key={cliente.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold leading-tight text-slate-800">
                {cliente.companyName}
              </h3>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-1 text-xs ${
                  cliente.active
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {cliente.active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <p className="text-xs uppercase text-slate-400">CNPJ</p>
                <p className="text-slate-700">{cliente.cnpj ? cliente.cnpj : "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Responsável</p>
                <p className="text-slate-700">{cliente.responsible?.name ?? "—"}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs uppercase text-slate-400">Equipamentos</span>
              <span className="inline-flex items-center rounded-full bg-navy/10 px-2.5 py-1 text-xs font-medium text-navy">
                {cliente._count.equipments} equip(s)
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Criado em {new Date(cliente.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        ))}
        {clientes.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-500">
            Nenhum cliente cadastrado.
            <Link href="/clientes/novo" className="ml-2 text-brand hover:underline">
              Cadastrar o primeiro
            </Link>
          </div>
        )}
      </div>

      {/* Desktop table (md+) */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
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
                  <span className="block max-w-[220px] truncate">{cliente.companyName}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {cliente.cnpj ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  <span className="block max-w-[160px] truncate">
                    {cliente.responsible?.name ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{cliente._count.equipments}</td>
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
            <Link href="/clientes/novo" className="ml-2 text-brand hover:underline">
              Cadastrar o primeiro
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
