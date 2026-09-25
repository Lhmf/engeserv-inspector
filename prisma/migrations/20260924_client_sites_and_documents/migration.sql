-- Additive migration: existing clients, equipment, inspections and reports remain untouched.
CREATE TYPE "ClientDocumentType" AS ENUM ('LAUDO', 'ART', 'INSPECAO', 'OUTRO');

CREATE TABLE "client_sites" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_sites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "client_sites_clientId_name_key" ON "client_sites"("clientId", "name");
ALTER TABLE "client_sites" ADD CONSTRAINT "client_sites_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "equipments" ADD COLUMN "siteId" TEXT;
ALTER TABLE "equipments" ADD CONSTRAINT "equipments_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "client_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "client_documents" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "siteId" TEXT,
  "type" "ClientDocumentType" NOT NULL,
  "originalName" TEXT NOT NULL,
  "storedName" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "client_documents_clientId_createdAt_idx" ON "client_documents"("clientId", "createdAt");
CREATE INDEX "client_documents_siteId_idx" ON "client_documents"("siteId");
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "client_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
