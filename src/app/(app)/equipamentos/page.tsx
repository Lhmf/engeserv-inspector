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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Equipamentos</h1>
          <p className="text-sm text-slate-500">
            Ficha técnica dos ativos de cada cliente (caldeiras, vasos, silos, tanques, tubulações)
          </p>
        </div>
        <a
          href="/equipamentos/novo"
          className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand"
        >
          Novo equipamento
        </a>
      </div>

      <NewEquipmentForm />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
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
                  {eq.client.companyName}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {eq.description ?? "—"}
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