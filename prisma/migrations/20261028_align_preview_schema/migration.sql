-- Align the existing Preview database with the current Prisma model.
-- The Preview database predates several additive fields. Every operation is
-- idempotent so a partially aligned database can safely run this migration.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "phone" TEXT;

ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "equipments"
  ADD COLUMN IF NOT EXISTS "serialNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "designCode" TEXT,
  ADD COLUMN IF NOT EXISTS "designTempC" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "operatingPressureBar" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "operatingTempC" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "mawpBar" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "hydroTestPressureBar" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "headType" TEXT,
  ADD COLUMN IF NOT EXISTS "lengthMm" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "insideDiameterMm" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "orientation" TEXT,
  ADD COLUMN IF NOT EXISTS "jointType" TEXT,
  ADD COLUMN IF NOT EXISTS "installationLocation" TEXT,
  ADD COLUMN IF NOT EXISTS "headMaterial" TEXT,
  ADD COLUMN IF NOT EXISTS "bodyMaterial" TEXT,
  ADD COLUMN IF NOT EXISTS "headNominalThicknessMm" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "volumeLiters" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "jointEfficiency" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "corrosionAllowanceMm" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "fluidType" TEXT,
  ADD COLUMN IF NOT EXISTS "fluidClass" TEXT,
  ADD COLUMN IF NOT EXISTS "riskGroup" INTEGER,
  ADD COLUMN IF NOT EXISTS "nr13Category" TEXT,
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "inspections"
  ADD COLUMN IF NOT EXISTS "fieldChecklist" JSONB,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

ALTER TABLE "technical_reports"
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

CREATE INDEX IF NOT EXISTS "equipments_clientId_active_idx"
  ON "equipments"("clientId", "active");

