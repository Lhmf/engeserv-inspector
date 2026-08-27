import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Factory,
  Gauge,
  Ruler,
  Thermometer,
  Droplets,
  Weight,
  Shield,
  FileText,
  ClipboardList,
} from "lucide-react";

export default async function EquipamentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const { id } = await params;

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      client: true,
      inspections: {
        orderBy: { startedAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          status: true,
          startedAt: true,
          completedAt: true,
          inspector: { select: { name: true } },
        },
      },

    },
  });

  if (!equipment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/equipamentos"
          className="mt-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">
            {equipment.tag} — {equipment.type.replace(/_/g, " ")}
          </h1>
          {equipment.description && (
            <p className="text-sm text-slate-500 mt-1">{equipment.description}</p>
          )}
        </div>
      </div>

      {/* Client Info */}
      {equipment.client && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-navy" />
            <h2 className="font-semibold text-slate-800">Cliente</h2>
          </div>
          <p className="text-slate-700">{equipment.client.companyName}</p>
          {equipment.client.cnpj && (
            <p className="text-sm text-slate-500">CNPJ: {equipment.client.cnpj}</p>
          )}
        </div>
      )}

      {/* Equipment Data */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Factory className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-slate-800">Dados Técnicos</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <DataItem label="TAG" value={equipment.tag} />
          <DataItem label="Tipo" value={equipment.type.replace(/_/g, " ")} />
          <DataItem label="Fabricante" value={equipment.manufacturer} />
          <DataItem label="Ano Fabricação" value={equipment.manufactureYear?.toString()} />
          <DataItem label="Nº Série" value={equipment.serialNumber} />
          <DataItem label="Código Projeto" value={equipment.designCode} />
          <DataItem
            label="Pressão Projeto"
            value={equipment.designPressureBar ? `${equipment.designPressureBar} bar` : undefined}
          />
          <DataItem
            label="Pressão Operação"
            value={equipment.operatingPressureBar ? `${equipment.operatingPressureBar} bar` : undefined}
          />
          <DataItem
            label="Temp. Projeto"
            value={equipment.designTempC ? `${equipment.designTempC} °C` : undefined}
          />
          <DataItem
            label="Esp. Original"
            value={equipment.originalThicknessMm ? `${equipment.originalThicknessMm} mm` : undefined}
          />
          <DataItem
            label="Esp. Mínima"
            value={equipment.minThicknessMm ? `${equipment.minThicknessMm} mm` : undefined}
          />
          <DataItem label="Material Casco" value={equipment.bodyMaterial} />
          <DataItem label="Material Tampa" value={equipment.headMaterial} />
          <DataItem label="Tipo Tampa" value={equipment.headType} />
          <DataItem
            label="Eficiência Solda"
            value={equipment.jointEfficiency ? `${(equipment.jointEfficiency * 100).toFixed(0)}%` : undefined}
          />
          <DataItem
            label="Volume"
            value={equipment.volumeLiters ? `${equipment.volumeLiters} L` : undefined}
          />
          <DataItem label="Fluido" value={equipment.fluidType} />
          <DataItem label="Cat. NR-13" value={equipment.nr13Category} />
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-slate-800">Inspeções Recentes</h2>
        </div>
        {equipment.inspections.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma inspeção registrada.</p>
        ) : (
          <div className="space-y-2">
            {equipment.inspections.map((insp) => (
              <Link
                key={insp.id}
                href={`/inspecoes/${insp.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-navy/50 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {insp.type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {insp.inspector.name} • {insp.startedAt ? formatDate(insp.startedAt) : "—"}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    insp.status === "APROVADA"
                      ? "bg-emerald-100 text-emerald-700"
                      : insp.status === "REJEITADA"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {insp.status.replace(/_/g, " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>


    </div>
  );
}

function DataItem({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-800">{String(value)}</p>
    </div>
  );
}
