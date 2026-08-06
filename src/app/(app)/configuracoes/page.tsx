import { getSession, canApproveInspection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ConfiguracoesPage() {
  const session = await getSession();

  const templates = await prisma.textTemplate.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });

  const isAdminOrGestor = session && canApproveInspection(session.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Configurações</h1>
        <p className="text-sm text-slate-500">Biblioteca de textos padrão para geração de laudos</p>
      </div>

      {isAdminOrGestor && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Biblioteca de Textos Padrão</h2>
          <p className="mb-4 text-sm text-slate-500">
            Gerencie os textos fixos usados na geração de laudos (recomendações, avisos, conclusões).
            Cada item pode ser selecionado no gerador de laudo (Sprint 5).
          </p>

          {/* Mobile cards (< md) */}
          <div className="space-y-3 md:hidden">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-slate-800">{t.code}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{t.title}</p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-1 text-xs ${
                      t.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {t.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs uppercase text-slate-400">{t.category}</span>
                  <Link
                    href={`/configuracoes/textos/${t.id}/editar`}
                    className="inline-flex min-h-11 items-center rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500">
                Nenhum texto padrão cadastrado.
              </div>
            )}
          </div>

          {/* Desktop table (md+) */}
          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Código</th>
                  <th className="px-4 py-2">Título</th>
                  <th className="px-4 py-2">Categoria</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-700 whitespace-nowrap">{t.code}</td>
                    <td className="px-4 py-2 text-slate-500"><span className="block max-w-[260px] truncate">{t.title}</span></td>
                    <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{t.category}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          t.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {t.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/configuracoes/textos/${t.id}/editar`}
                        className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm text-brand hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {templates.length === 0 && (
              <div className="px-4 py-8 text-center text-slate-500">
                Nenhum texto padrão cadastrado.
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Link
              href="/configuracoes/textos/novo"
              className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand"
            >
              Novo Texto Padrão
            </Link>
          </div>
        </div>
      )}

      {!isAdminOrGestor && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">
            Acesso restrito a Administrador Master e Gestor.
          </p>
        </div>
      )}
    </div>
  );
}