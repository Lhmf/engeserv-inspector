import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewEquipmentForm from "./NewEquipmentForm";

export default async function EquipamentosPage() {
  const session = await getSession();

  const equipamentos = await prisma.equipment.findMany({
    select: {
      id: true,
      tag: true,
      type: true,
      description: true,
      client: { select: { id: true, companyName: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Equipamentos</h1>
          <p className="text-sm text-slate-500">
            Ficha técnica dos ativos de cada cliente (caldeiras, vasos, silos, tanques, tubulações)
          </p>
        </div>
        <a
          href="/equipamentos/novo"
          className="w-full sm:w-auto text-center rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand"
        >
          Novo equipamento
        </a>
      </div>

      <NewEquipmentForm />

      {/* Mobile cards (< md) */}
      <div className="md:hidden space-y-3">
        {equipamentos.map((eq) => (
          <div
            key={eq.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{eq.tag}</p>
                <p className="text-sm text-slate-500">{eq.type.replace("_", " ")}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 whitespace-nowrap">
                {new Date(eq.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-400 uppercase">Cliente</p>
              <p className="text-sm font-medium text-slate-700 truncate">{eq.client.companyName}</p>
            </div>
            {eq.description && (
              <p className="mt-2 text-sm text-slate-500 line-clamp-2">{eq.description}</p>
            )}
          </div>
        ))}
        {equipamentos.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-500">
            Nenhum equipamento cadastrado.
            <a href="/equipamentos/novo" className="ml-2 text-brand hover:underline">
              Cadastrar o primeiro
            </a>
          </div>
        )}
      </div>

      {/* Desktop table (md+) */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">TAG</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Criado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {equipamentos.map((eq) => (
              <tr key={eq.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{eq.tag}</td>
                <td className="px-4 py-3 text-slate-500">
                  {eq.type.replace("_", " ")}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  <span className="block max-w-[180px] truncate">{eq.client.companyName}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  <span className="block max-w-[260px] truncate">{eq.description ?? "—"}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(eq.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {equipamentos.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">
            Nenhum equipamento cadastrado.
            <a
              href="/equipamentos/novo"
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