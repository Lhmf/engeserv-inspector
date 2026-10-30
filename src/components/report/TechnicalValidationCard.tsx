"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";

type Assessment = {
  reasons?: string[];
  canEmitDefinitive?: boolean;
  technicalValidationApproved?: boolean;
  technicalValidationStatus?: "PENDING" | "APPROVED" | "REJECTED";
};

export function TechnicalValidationCard({
  reportId,
  assessment,
  role,
  onUpdated,
}: {
  reportId: string;
  assessment: Assessment | null;
  role?: string;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const status = assessment?.technicalValidationStatus || "PENDING";
  const approved = Boolean(assessment?.technicalValidationApproved);
  const isMaster = role === "ADMIN_MASTER";

  async function submit(action: "REQUEST" | "APPROVE") {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/reports/${reportId}/technical-validation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível atualizar a validação técnica.");
      setMessage(action === "APPROVE" ? "Validação aprovada. O PDF definitivo está liberado." : "Solicitação enviada ao Administrador Master.");
      onUpdated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar a validação técnica.");
    } finally {
      setLoading(false);
    }
  }

  if (approved) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5" aria-label="Validação técnica aprovada">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <h2 className="font-semibold text-emerald-950">Validação técnica aprovada</h2>
            <p className="mt-1 text-sm text-emerald-800">O critério dos pontos não medidos e os resultados registrados foram aprovados. O PDF definitivo pode ser gerado.</p>
            {message && <p className="mt-2 text-sm font-medium text-emerald-800">{message}</p>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-5" aria-label="Validação técnica">
      <div className="flex items-start gap-3">
        {status === "REJECTED" ? <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" /> : <Clock className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />}
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-amber-950">PDF definitivo bloqueado: falta validação técnica</h2>
          <p className="mt-1 text-sm text-amber-900">Esta tela demonstrativa não libera o documento técnico. Um Administrador Master precisa revisar os dados abaixo e aprovar explicitamente.</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-amber-950">
            <li>Confira as medições e a ficha técnica do equipamento.</li>
            <li>Confirme o critério: pontos não medidos recebem o menor valor medido da região, com asterisco.</li>
            <li>Registre a aprovação técnica para liberar o PDF definitivo.</li>
          </ol>
          {assessment?.reasons && assessment.reasons.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-white/60 p-3 text-sm text-amber-950">
              <p className="font-medium">Pendências objetivas:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">{assessment.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isMaster ? (
              <button type="button" disabled={loading} onClick={() => submit("APPROVE")} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Aprovar validação e liberar PDF
              </button>
            ) : (
              <button type="button" disabled={loading} onClick={() => submit("REQUEST")} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                Solicitar validação ao Administrador Master
              </button>
            )}
          </div>
          {message && <p className="mt-3 text-sm font-medium text-amber-950" role="status">{message}</p>}
        </div>
      </div>
    </section>
  );
}
