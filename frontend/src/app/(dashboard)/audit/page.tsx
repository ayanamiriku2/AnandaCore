"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePagination } from "@/hooks/use-pagination";
import { formatDateTime } from "@/lib/utils";
import { Search, Shield } from "lucide-react";
import { useState } from "react";
import type { AuditLog, PaginatedResponse } from "@/types";

export default function AuditPage() {
  const pagination = usePagination();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<AuditLog>>({
    queryKey: ["audit-logs", pagination.page, pagination.per_page, search],
    queryFn: () =>
      api
        .get("/audit-logs", {
          params: {
            page: pagination.page,
            per_page: pagination.per_page,
            search: search || undefined,
          },
        })
        .then((r) => r.data),
  });

  const actionBadge = (action: string) => {
    if (action.includes("create") || action.includes("insert"))
      return "success";
    if (action.includes("update") || action.includes("edit")) return "info";
    if (action.includes("delete") || action.includes("remove"))
      return "danger";
    return "default" as const;
  };

  const columns = [
    {
      key: "created_at",
      header: "Waktu",
      render: (item: AuditLog) => formatDateTime(item.created_at),
    },
    { key: "user_name", header: "Pengguna" },
    {
      key: "action",
      header: "Aksi",
      render: (item: AuditLog) => (
        <Badge variant={actionBadge(item.action) as "success" | "info" | "danger" | "default"}>
          {item.action}
        </Badge>
      ),
    },
    { key: "entity_type", header: "Entitas" },
    {
      key: "entity_id",
      header: "ID Entitas",
      render: (item: AuditLog) =>
        item.entity_id ? item.entity_id.slice(0, 8) + "..." : "-",
    },
    { key: "ip_address", header: "IP Address" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-[var(--primary)]" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Audit Log</h1>
          <p className="text-[var(--muted-foreground)]">
            Riwayat aktivitas dan perubahan sistem
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari log..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        page={data?.page}
        totalPages={data?.total_pages}
        total={data?.total}
        onPageChange={pagination.setPage}
        emptyMessage="Belum ada log audit"
      />
    </div>
  );
}
