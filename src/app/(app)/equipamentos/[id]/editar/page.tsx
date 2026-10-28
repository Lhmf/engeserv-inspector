import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EquipmentTechnicalEditor from "./EquipmentTechnicalEditor";

export default async function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const { id } = await params;
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    select: { id: true, tag: true, designPressureBar: true, originalThicknessMm: true, minThicknessMm: true },
  });
  if (!equipment) notFound();
  return <EquipmentTechnicalEditor equipment={equipment} />;
}
