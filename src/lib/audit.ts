import prisma from "./db";

export interface LogAuditParams {
  actorId?: string | null;
  action: string; // e.g. "REPORT_CREATED", "STATUS_UPDATED", "STAFF_ASSIGNED", "CATEGORY_EDITED"
  entity: string; // e.g. "Report", "User", "Category", "Agency"
  entityId?: string | null;
  previousState?: any;
  newState?: any;
  ipAddress?: string | null;
}

export async function createAuditLog(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        previousState: params.previousState ? JSON.stringify(params.previousState) : null,
        newState: params.newState ? JSON.stringify(params.newState) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
}
