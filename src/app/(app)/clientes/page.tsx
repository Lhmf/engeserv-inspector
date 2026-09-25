import { prisma } from "@/lib/prisma";
import { ClientesClient } from "./ClientesClient";

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({ select: { id: true, companyName: true, cnpj: true, address: true, active: true, createdAt: true, responsible: { select: { name: true } }, _count: { select: { equipments: true } } }, orderBy: { createdAt: "desc" } });
  return <ClientesClient clients={clients.map((client) => ({ ...client, createdAt: client.createdAt.toISOString() }))} />;
}
