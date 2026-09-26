import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientDocumentsPanel } from "./ClientDocumentsPanel";
import { ClientSitesPanel } from "./ClientSitesPanel";

const status: Record<string, string> = { EM_ANDAMENTO: "Em andamento", AGUARDANDO_APROVACAO: "Aguardando aprovação", APROVADA: "Aprovada", REJEITADA: "Rejeitada" };

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({ where: { id: params.id }, include: { sites: { orderBy: { name: "asc" } }, equipments: { include: { inspections: { include: { technicalReport: true }, orderBy: { startedAt: "desc" } }, site: true }, orderBy: { tag: "asc" } }, documents: { include: { site: { select: { id: true, name: true } }, uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } } } });
  if (!client) notFound();
    const inspections = client.equipments.flatMap((equipment) => equipment.inspections.map((inspection) => ({ inspection, equipment })));
  const reports = inspections.filter(({ inspection }) => inspection.technicalReport).map(({ inspection, equipment }) => ({ report: inspection.technicalReport!, equipment }));

  // Group reports by site/frente
  const reportsBySite = new Map<string, { report: { id: string; reportNumber: string; inspectionDate: Date | string }; equipment: { tag: string; site: { id: string; name: string } | null } }[]>();
  reports.forEach(({ report, equipment }) => {
    const siteName = equipment.site?.name || "Sem frente definida";
    const siteId = equipment.site?.id || "none";
    const key = siteId + "|" + siteName;
    if (!reportsBySite.has(key)) reportsBySite.set(key, []);
    reportsBySite.get(key)!.push({ report, equipment });
  });

  // Group inspections by site/frente
  const inspectionsBySite = new Map<string, { inspection: { id: string; startedAt: Date | string; status: string }; equipment: { tag: string; site: { id: string; name: string } | null } }[]>();
  inspections.forEach(({ inspection, equipment }) => {
    const siteName = equipment.site?.name || "Sem frente definida";
    const siteId = equipment.site?.id || "none";
    const key = siteId + "|" + siteName;
    if (!inspectionsBySite.has(key)) inspectionsBySite.set(key, []);
    inspectionsBySite.get(key)!.push({ inspection, equipment });
  });
  return <div className="space-y-6"><Link href="/clientes" className="text-sm font-medium text-navy hover:underline">← Clientes</Link><div><h1 className="text-2xl font-bold text-slate-800">{client.companyName}</h1><p className="mt-1 text-sm text-slate-500">CNPJ/CPF: {client.cnpj || "Não informado"}</p></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[["Equipamentos", client.equipments.length], ["Inspeções", inspections.length], ["Laudos", reports.length], ["Documentos", client.documents.length]].map(([label, count]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-800">{count}</p></div>)}</div>
      <ClientSitesPanel
        clientId={client.id}
        initialSites={client.sites.map((s) => ({
          id: s.id,
          name: s.name,
          address: s.address,
          active: s.active,
        }))}
      />
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">Laudos</h2>
        <div className="mt-3 space-y-3">
          {reports.length ? Array.from(reportsBySite.entries()).map(([key, siteReports]) => {
            const [siteId, siteName] = key.split("|");
            return (
              <div key={key} className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <span className="h-5 w-5 text-navy">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-4 h-4" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  {siteName}
                </h3>
                <div className="ml-6 space-y-2">
                  {siteReports.map(({ report, equipment }) => (
                    <div key={report.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                      <div>
                        <p className="font-medium text-slate-800">{report.reportNumber}</p>
                        <p className="text-sm text-slate-500">{equipment.tag} · {new Date(report.inspectionDate).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <Link href={`/reports/${report.id}`} className="text-sm font-medium text-navy hover:underline">Abrir laudo</Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          }) : <p className="text-sm text-slate-500">Nenhum laudo gerado para este cliente.</p>}
        </div>
      </section><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">Inspeções e equipamentos</h2>
        <div className="mt-3 space-y-3">
          {inspections.length ? Array.from(inspectionsBySite.entries()).map(([key, siteInspections]) => {
            const [siteId, siteName] = key.split("|");
            return (
              <div key={key} className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <span className="h-5 w-5 text-navy">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-4 h-4" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  {siteName}
                </h3>
                <div className="ml-6 space-y-2">
                  {siteInspections.map(({ inspection, equipment }) => (
                    <Link key={inspection.id} href={`/inspecoes/${inspection.id}`} className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                      <p className="font-medium text-slate-800">{equipment.tag}</p>
                      <p className="text-sm text-slate-500">{new Date(inspection.startedAt).toLocaleDateString("pt-BR")} · {status[inspection.status]}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          }) : <p className="text-sm text-slate-500">Nenhuma inspeção registrada.</p>}
        </div>
      </section><ClientDocumentsPanel clientId={client.id} sites={client.sites} initialDocuments={client.documents.map((document) => ({ ...document, createdAt: document.createdAt.toISOString() }))} /></div>;
}
