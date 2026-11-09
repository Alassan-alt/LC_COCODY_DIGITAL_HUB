import { useQuery } from "@tanstack/react-query";
import { listAuditLogs, type ListAuditLogsParams } from "./api";

export function useAuditLogs(params: ListAuditLogsParams) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => listAuditLogs(params),
    placeholderData: (previous) => previous,
  });
}
