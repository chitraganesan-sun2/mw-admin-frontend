import { endpoints } from "../constants";
import { GET_API } from "../request";

export interface AuditEntry {
  audit_id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogPage {
  data: AuditEntry[];
  total: number;
}

export interface AuditLogFilters {
  page: number;
  size: number;
  action?: string;
  target_id?: string;
  admin_id?: string;
}

export const getAuditLog = async (filters: AuditLogFilters): Promise<AuditLogPage> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const body = (await GET_API(`${endpoints.auditLog}?${query.toString()}`))?.data;
  return { data: body?.data ?? [], total: body?.total ?? 0 };
};
