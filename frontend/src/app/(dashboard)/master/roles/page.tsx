"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import type { Role } from "@/types";

export default function RolesPage() {
  const { data, isLoading } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => api.get("/master/roles").then((r) => r.data),
  });

  const columns = [
    {
      key: "display_name",
      header: "Nama Peran",
      render: (item: Role) => (
        <span className="font-medium">{item.display_name}</span>
      ),
    },
    { key: "name", header: "Kode" },
    { key: "description", header: "Deskripsi" },
    {
      key: "permissions",
      header: "Jumlah Izin",
      render: (item: Role) => item.permissions?.length || 0,
    },
    {
      key: "is_active",
      header: "Status",
      render: (item: Role) => (
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
        <h1 className="text-2xl font-bold">Peran & Hak Akses</h1>
        <p className="text-[var(--muted-foreground)]">
          Kelola peran dan izin pengguna
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data || []}
        emptyMessage="Belum ada peran"
      />
    </div>
  );
}
