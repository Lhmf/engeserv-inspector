"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPortalSession } from "@/portal/lib/portal-auth";

export default function EquipamentoFichaTecnica() {
  const [session, setSession] = useState(null);
  const [equipamento, setEquipamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const session = await getPortalSession();
      setSession(session);

      if (!session?.clientId) {
        router.replace("/portal/login");
        return;
      }

      try {
        const pathSegments = router.pathname.split("/");
        const equipId = pathSegments[pathSegments.length - 1];

        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || ""}/portal/equipamentos/${equipId}`,
          {
            credentials: "include",
          }
        );
        const data = await resp.json();
        setEquipamento(data.equipamento);
      } catch (err) {
        console.error("Erro ao carregar ficha tecnica", err);
      }

      setLoading(false);
    }

    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-800">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></span>
      </div>
    );
  }

  if (!session) {
    router.replace("/portal/login");
    return null;
  }

  if (!equipamento) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 p-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          Equipamento nao encontrado
        </h1>
        <p className="text-sm text-slate-500">
          Equipamento nao encontrado ou acesso nao autorizado.
        </p>
        <button
          onClick={() => router.replace("/portal/equipamentos")}
          className="mt-4 text-primary hover-underline text-sm"
        >
          Voltar para equipamentos
        </button>
      </div>
    );
  }

  const e = equipamento;

  // Helper para formatacao condicional
  const fmt = (v) => (v !== undefined && v !== null ? String(v) : "Nao informado");
  const fmtFloat = (v) =>
    v !== undefined && v !== null ? String(v.toFixed(2)) : "Nao informado";

  return (
    <div className="bg-white dark:bg-gray-800 p-6">
      {/* Header do Equipamento */}
      <header className="border-b border-slate-200 pb-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <div className="w-full sm:w-64">
            <h2 className="text-2xl font-bold text-slate-900">
              {e.tag}
            </h2>
            <p className="text-sm text-slate-500">{e.type || "—"}</p>
          </div>
          <div className="w-full sm:w-32 sm:text-right">
            <span className="text-sm font-medium text-slate-500">
              Fabricante:
            </span>
            <span className="text-slate-600">{e.manufacturer || "—"}</span>
          </div>
          <div className="w-full sm:w-32 sm:text-right">
            <span className="text-sm font-medium text-slate-500">
              Ano:
            </span>
            <span className="text-slate-600">{e.manufactureYear || "—"}</span>
          </div>
        </div>
      </header>

      {/* Status */}
      <div className="mt-4 text-sm text-slate-500">
        Vigência: Nao informado
      </div>

      {/* Identificacao */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            TAG
          </p>
          <p className="text-3xl font-bold text-slate-900">{e.tag}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Tipo
          </p>
          <p className="text-3xl font-bold text-slate-900">{e.type || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Descricao
          </p>
          <p className="text-lg text-slate-600">{e.description || "Nao informado"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Fabricante
          </p>
          <p className="text-lg text-slate-600">{e.manufacturer || "Nao informado"}</p>
        </div>
      </div>

      {/* Dados de Projeto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Pressao de Projeto (bar)
          </p>
          <p className="text-lg font-medium">{fmtFloat(e.designPressureBar)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            PMTA (bar)
          </p>
          <p className="text-lg font-medium">{fmtFloat(e.mawpBar)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Volume (litros)
          </p>
          <p className="text-lg font-medium">{fmtFloat(e.volumeLiters)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Codigo de Projeto
          </p>
          <p className="text-lg text-slate-600">{e.designCode || "Nao informado"}</p>
        </div>
      </div>

      {/* Condicoes Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Pressao Oper. (bar)
          </p>
          <p className="text-lg font-medium">{fmtFloat(e.operatingPressureBar)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Temp. Oper. (C)
          </p>
          <p className="text-lg font-medium">{fmt(e.operatingTempC)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Tipo de Fluido
          </p>
          <p className="text-lg text-slate-600">{e.fluidType || "Nao informado"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Classe Fluido
          </p>
          <p className="text-lg text-slate-600">{e.fluidClass || "Nao informado"}</p>
        </div>
      </div>

      {/* Construcao */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Espessura Original (mm)
          </p>
          <p className="text-lg font-medium">{fmtFloat(e.originalThicknessMm)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Esp. Minima (mm)
          </p>
          <p className="text-lg font-medium">{fmtFloat(e.minThicknessMm)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Tipo de Cabeca
          </p>
          <p className="text-lg text-slate-600">{e.headType || "Nao informado"}</p>
        </div>
      </div>

      {/* Mais detalhes de construcao */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Material da Cabeca
          </p>
          <p className="text-lg text-slate-600">{e.headMaterial || "Nao informado"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Esp. Nominal da Cabeca (mm)
          </p>
          <p className="text-lg font-medium">{fmtFloat(e.headNominalThicknessMm)}</p>
        </div>
      </div>

      {/* Juntas e Corrosao */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Eficiencia de Solda
          </p>
          <p className="text-lg font-medium">
            {e.jointEfficiency !== undefined ? String(e.jointEfficiency) : "Nao informado"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Allowance de Corrosao (mm)
          </p>
          <p className="text-lg font-medium">{fmtFloat(e.corrosionAllowanceMm)}</p>
        </div>
      </div>

      {/* Localizacao */}
      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          Frente / Site
        </p>
        <p className="text-lg font-medium text-slate-600">{e.site || "—"}</p>
        {e.siteAddress && (
          <p className="text-sm text-slate-500 mt-1">{e.siteAddress}</p>
        )}
      </div>

      {/* Historico de Inspecoes */}
      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
          Historico de Inspecoes
        </p>
        {e.totalInspecoes > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {e.ultimasInspecoes?.map((insp, idx) => {
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      {insp.tipo || "—"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {insp.dataInicial || "—"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {insp.observacoes || "—"}
                  </p>
                  {insp.recomendacoes && (
                    <span className="text-[80%] block cursor-help">·</span>
                  )}
                  {insp.laudo && (
                    <div className="mt-2 text-xs">
                      <span className="text-[80%] block cursor-help">
                        Laudo{insp.laudo.numero} - {insp.laudo.status}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhuma inscricao registrada.</p>
        )}
      </div>

      {/* Historico de Laudos */}
      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
          Historico de Laudos
        </p>
        {e.totalInspecoes > 0 && e.ultimasInspecoes?.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {e.ultimasInspecoes
              .filter((i) => i.laudo)
              .slice(0, 5)
              .map((i) => {
                const l = i.laudo;
                return (
                  <div
                    key={l.numero}
                    className="flex items-center justify-between text-xs text-slate-500"
                  >
                    <span>{l.numero} v{l.versao}</span>
                    <span>{l.status}</span>
                  </div>
                );
              })
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhum laudo registrado.</p>
        )}
      </div>

      {/* Voltar */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={() => router.replace("/portal/equipamentos")}
          className="w-full flex items-center justify-center py-3 text-sm text-primary hover-underline"
        >
          ← Voltar para equipamentos
        </button>
      </div>
    </div>
  );
}