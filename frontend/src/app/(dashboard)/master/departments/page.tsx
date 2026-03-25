"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import type { Department } from "@/types";

export default function DepartmentsPage() {
  const { data, isLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => api.get("/master/departments").then((r) => r.data),
  });

  const columns = [
    { key: "code", header: "Kode" },
    {
      key: "name",
      header: "Nama Departemen",
      render: (item: Department) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    { key: "description", header: "Deskripsi" },
    { key: "head_name", header: "Kepala" },
    {
      key: "is_active",
      header: "Status",
      render: (item: Department) => (
        <Badge variant={item.is_active ? "success" : "default"}>
          {item.is_active ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
  ];

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Departemen</h1>
        <p className="text-[var(--muted-foreground)]">
          Kelola departemen yayasan
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data || []}
        emptyMessage="Belum ada departemen"
      />
    </div>
  );
}
