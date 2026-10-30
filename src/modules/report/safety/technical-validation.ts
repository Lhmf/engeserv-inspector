export type TechnicalValidationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TechnicalValidationRecord {
  status: TechnicalValidationStatus;
  requestedAt?: string;
  requestedById?: string;
  requestedByName?: string;
  approvedAt?: string;
  approvedById?: string;
  approvedByName?: string;
  rejectedAt?: string;
  rejectedById?: string;
  rejectedByName?: string;
  comments?: string;
}

export function readTechnicalValidation(metadata: unknown): TechnicalValidationRecord {
  if (!metadata || typeof metadata !== "object") return { status: "PENDING" };
  const raw = (metadata as Record<string, unknown>).technicalValidation;
  if (!raw || typeof raw !== "object") return { status: "PENDING" };

  const value = raw as Record<string, unknown>;
  const status = value.status;
  return {
    status: status === "APPROVED" || status === "REJECTED" ? status : "PENDING",
    requestedAt: typeof value.requestedAt === "string" ? value.requestedAt : undefined,
    requestedById: typeof value.requestedById === "string" ? value.requestedById : undefined,
    requestedByName: typeof value.requestedByName === "string" ? value.requestedByName : undefined,
    approvedAt: typeof value.approvedAt === "string" ? value.approvedAt : undefined,
    approvedById: typeof value.approvedById === "string" ? value.approvedById : undefined,
    approvedByName: typeof value.approvedByName === "string" ? value.approvedByName : undefined,
    rejectedAt: typeof value.rejectedAt === "string" ? value.rejectedAt : undefined,
    rejectedById: typeof value.rejectedById === "string" ? value.rejectedById : undefined,
    rejectedByName: typeof value.rejectedByName === "string" ? value.rejectedByName : undefined,
    comments: typeof value.comments === "string" ? value.comments : undefined,
  };
}

export function isTechnicalValidationApproved(metadata: unknown): boolean {
  const validation = readTechnicalValidation(metadata);
  return validation.status === "APPROVED" && Boolean(validation.approvedById && validation.approvedAt);
}
