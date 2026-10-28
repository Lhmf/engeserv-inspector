ALTER TABLE "inspections"
  ADD COLUMN IF NOT EXISTS "fieldChecklist" JSONB;
