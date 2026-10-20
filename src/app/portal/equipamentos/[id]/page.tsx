"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { formatDataBR, Loading, PageHeader } from "@/components/portal/ui";

interface EquipamentoDetalhe {
  id: string;
  tag: string;
  type: string;
  description: string | null;
  manufacturer: string | null;
  manufactureYear: number | null;

  designPressureBar: number | null;
  operatingPressureBar: number | null;
  operatingTempC: number | null;
  mawpBar: number | null;
  volumeLiters: number | null;
  designCode: string | null;
  fluidType: string | null;
  fluidClass: string | null;
  riskGroup: string | null;
  nr13Category: string | null;

  originalThicknessMm: number | null;
  minThicknessMm: number | null;
  headType: string | null;
  headMaterial: string | null;
  headNominalThicknessMm: number | null;
  jointEfficiency: number | null;
  corrosionAllowanceMm: number | null;

  site: string | null;
  siteAddress: string | null;

  totalInspecoes: number;
  ultimasInspecoes: {
    id: string;
    tipo: string;
    status: string;
    dataInicial: string | null;
    dataConclusao: string | null;
    observacoes: string | null;
    recomendacoes: string | null;
    laudo: {
      id: string;
      numero: string;
      versao: number;
      status: string;
      vigente: boolean;
    } | null;
  }[];
}

interface PortalSession {
  clientId: string;
  name: string;
  role: "CLIENTE";
}

export default function EquipamentoDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<PortalSession | null>(null);
  const [equipamento, setEquipamento] = useState<EquipamentoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const sessionResp = await fetch("/api/portal/session", { credentials: "include" });
        if (!sessionResp.ok) {
          router.replace("/portal/login");
          return;
        }
        const sessionData = await sessionResp.json();
        if (!sessionData.session) {
          router.replace("/portal/login");
          return;
        }
        setSession(sessionData.session);
        // Clear error at start of new attempt
        setError(null);

        const resp = await fetch(`/api/portal/equipamentos/${id}`, { credentials: "include" });
        if (resp.status === 401) {
          router.replace("/portal/login");
          return;
        }
        if (resp.status === 404) {
          setError("Equipamento não encontrado ou acesso não autorizado.");
          setLoading(false);
          return;
        }
        if (!resp.ok) {
          setError("Erro ao carregar equipamento.");
          setLoading(false);
          return;
        }
        const data = await resp.json();
        setError(null);
        setEquipamento(data.equipamento);
      } catch (err) {
        console.error(err);
        setError("Erro inesperado ao carregar equipamento.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [id, router]);

  // Redireciona para o login somente depois de concluído o carregamento
  // inicial sem sessão — como efeito, nunca durante o render.
  useEffect(() => {
    if (!loading && !session) {
      router.replace("/portal/login");
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-800">
        <Loading size="lg" text="Carregando equipamento..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !equipamento) {
    return (
      <div className="bg-white dark:bg-gray-800 min-h-screen">
        <PageHeader
          title="Equipamento"
          subtitle={`Olá, ${session.name}`}
          backHref="/portal/equipamentos"
        />
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto text-slate-300 mb-4">
              <svg
                className="w-16 h-16 mx-auto text-slate-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-1">Equipamento não encontrado</h2>
            <p className="text-slate-500 mb-4">{error || "Este equipamento não existe ou você não tem permissão para acessá-lo."}</p>
            <Link
              href="/portal/equipamentos"
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para equipamentos
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = formatDataBR;

  /**
   * A API de detalhe do equipamento repassa Inspection.recommendations cru.
   * O campo é String contendo texto livre OU array JSON (ex.:
   * [{"description":"Substituir anel de vedação"}]). Sem formatação, o
   * cliente veria JSON bruto. Normaliza para texto sem alterar contrato.
   */
  const formatRecommendations = (value: string | null): string | null => {
    if (value == null) return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[]") return null;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const lines = parsed
          .map((item): string | null => {
            if (typeof item === "string") return item.trim() || null;
            if (item && typeof item === "object" && "description" in item) {
              const description = (item as { description?: unknown }).description;
              return typeof description === "string" && description.trim() ? description.trim() : null;
            }
            return null;
          })
          .filter((line): line is string => line !== null);
        return lines.join("\n") || null;
      }
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        // Objeto único com description
        if (
          "description" in obj &&
          typeof obj.description === "string" &&
          obj.description.trim()
        ) {
          return obj.description.trim();
        }
        // Objeto de seções (immediate/shortTerm/mediumTerm/longTerm) —
        // mesmo formato usado nas recomendações de laudo técnico.
        const sections: Array<[string, unknown]> = [
          ["Ações imediatas", obj.immediate],
          ["Curto prazo", obj.shortTerm],
          ["Médio prazo", obj.mediumTerm],
          ["Longo prazo", obj.longTerm],
        ];
        const lines: string[] = [];
        for (const [label, items] of sections) {
          if (!Array.isArray(items)) continue;
          const texts = items
            .map((item): string | null => {
              if (typeof item === "string") return item.trim() || null;
              if (item && typeof item === "object" && "description" in item) {
                const description = (item as { description?: unknown }).description;
                return typeof description === "string" && description.trim() ? description.trim() : null;
              }
              return null;
            })
            .filter((line): line is string => line !== null);
          if (texts.length) {
            lines.push(label);
            lines.push(...texts.map((text) => `- ${text}`));
          }
        }
        if (lines.length) return lines.join("\n");
      }
    } catch {
      // texto livre, não é JSON
    }
    return trimmed;
  };

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen">
      <PageHeader
        title={`Equipamento: ${equipamento.tag}`}
        subtitle={`Olá, ${session.name}`}
        backHref="/portal/equipamentos"
        backLabel="Voltar para equipamentos"
      />

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Informações Gerais */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Informações Gerais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Tag</label>
                <p className="text-slate-900 dark:text-white font-mono text-lg">{equipamento.tag}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Tipo</label>
                <p className="text-slate-900 dark:text-white">{equipamento.type || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Fabricante</label>
                <p className="text-slate-900 dark:text-white">{equipamento.manufacturer || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Ano de Fabricação</label>
                <p className="text-slate-900 dark:text-white">{equipamento.manufactureYear?.toString() || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Frente</label>
                <p className="text-slate-900 dark:text-white">{equipamento.site || "—"}</p>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Descrição</label>
                <p className="text-slate-900 dark:text-white">{equipamento.description || "—"}</p>
              </div>
            </div>
          </section>

          {/* Dados de Projeto */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Dados de Projeto (NR-13)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Pressão de Projeto</label>
                <p className="text-slate-900 dark:text-white">{equipamento.designPressureBar !== null ? `${equipamento.designPressureBar} bar` : "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Pressão de Operação</label>
                <p className="text-slate-900 dark:text-white">{equipamento.operatingPressureBar !== null ? `${equipamento.operatingPressureBar} bar` : "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Temperatura de Operação</label>
                <p className="text-slate-900 dark:text-white">{equipamento.operatingTempC !== null ? `${equipamento.operatingTempC} °C` : "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">PMTA (MAWP)</label>
                <p className="text-slate-900 dark:text-white">{equipamento.mawpBar !== null ? `${equipamento.mawpBar} bar` : "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Volume</label>
                <p className="text-slate-900 dark:text-white">{equipamento.volumeLiters !== null ? `${equipamento.volumeLiters} L` : "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Código de Projeto</label>
                <p className="text-slate-900 dark:text-white">{equipamento.designCode || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Tipo de Fluido</label>
                <p className="text-slate-900 dark:text-white">{equipamento.fluidType || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Classe do Fluido</label>
                <p className="text-slate-900 dark:text-white">{equipamento.fluidClass || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Grupo de Risco</label>
                <p className="text-slate-900 dark:text-white">{equipamento.riskGroup || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Categoria NR-13</label>
                <p className="text-slate-900 dark:text-white">{equipamento.nr13Category || "—"}</p>
              </div>
            </div>
          </section>

          {/* Condições de Construção */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428c2.392 2.392 2.392 6.272 0 8.664M9.5 11.5c-2.392-2.392-6.272-2.392-8.664 0M15 7.5c2.392-2.392 6.272-2.392 8.664 0M7.5 15c-2.392 2.392-2.392 6.272 0 8.664M9 9c2.392 2.392 6.272 2.392 8.664 0" />
              </svg>
              Condições de Construção
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Espessura Original</label>
                <p className="text-slate-900 dark:text-white">{equipamento.originalThicknessMm !== null ? `${equipamento.originalThicknessMm} mm` : "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Espessura Mínima</label>
                <p className="text-slate-900 dark:text-white">{equipamento.minThicknessMm !== null ? `${equipamento.minThicknessMm} mm` : "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Tipo de Cabeça</label>
                <p className="text-slate-900 dark:text-white">{equipamento.headType || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Material da Cabeça</label>
                <p className="text-slate-900 dark:text-white">{equipamento.headMaterial || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Esp. Nominal da Cabeça</label>
                <p className="text-slate-900 dark:text-white">{equipamento.headNominalThicknessMm !== null ? `${equipamento.headNominalThicknessMm} mm` : "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Eficiência da Junta</label>
                <p className="text-slate-900 dark:text-white">{equipamento.jointEfficiency !== null ? `${(equipamento.jointEfficiency * 100).toFixed(0)}%` : "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Margem de Corrosão</label>
                <p className="text-slate-900 dark:text-white">{equipamento.corrosionAllowanceMm !== null ? `${equipamento.corrosionAllowanceMm} mm` : "—"}</p>
              </div>
            </div>
          </section>

          {/* Histórico de Inspeções */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Histórico de Inspeções ({equipamento.totalInspecoes})
              </h2>
            </div>

            {equipamento.ultimasInspecoes.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-slate-500">Nenhuma inspeção aprovada registrada para este equipamento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {equipamento.ultimasInspecoes.map((insp) => (
                  <div
                    key={insp.id}
                    className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-semibold text-navy">{insp.tipo}</span>
                        <StatusBadge status={insp.status} />
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-4">
                        {insp.dataInicial && <span>Início: {formatDate(insp.dataInicial)}</span>}
                        {insp.dataConclusao && <span>Conclusão: {formatDate(insp.dataConclusao)}</span>}
                      </div>
                    </div>

                    {insp.observacoes && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{insp.observacoes}</p>
                    )}

                    {(() => {
                      const texto = formatRecommendations(insp.recomendacoes);
                      if (!texto) return null;
                      return (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
                          <strong className="block mb-1">Recomendações:</strong>
                          <span className="whitespace-pre-wrap">{texto}</span>
                        </div>
                      );
                    })()}

                    {insp.laudo && (
                      <Link
                        href={`/portal/laudos/${insp.laudo.id}`}
                        className="inline-flex items-center gap-2 mt-3 text-sm text-navy hover:underline"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Laudo: {insp.laudo.numero} (v{insp.laudo.versao})
                        <StatusBadge
                          status={insp.laudo.vigente ? "OK" : "VENCIDO"}
                          className="ml-1"
                        />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}