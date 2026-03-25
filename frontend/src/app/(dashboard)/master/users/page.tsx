"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePagination } from "@/hooks/use-pagination";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";
import { useState } from "react";
import type { User, PaginatedResponse } from "@/types";

export default function UsersPage() {
  const pagination = usePagination();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<User>>({
    queryKey: ["users", pagination.page, pagination.per_page, search],
    queryFn: () =>
      api
        .get("/users", {
          params: {
            page: pagination.page,
            per_page: pagination.per_page,
            search: search || undefined,
          },
        })
        .then((r) => r.data),
  });

  const columns = [
    {
      key: "full_name",
      header: "Nama",
      render: (item: User) => (
        <span className="font-medium">{item.full_name}</span>
      ),
    },
    { key: "email", header: "Email" },
    {
      key: "roles",
      header: "Peran",
      render: (item: User) => (
        <div className="flex flex-wrap gap-1">
          {item.roles?.map((r) => (
            <Badge key={r.id} variant="info">
              {r.display_name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "department",
      header: "Departemen",
      render: (item: User) => item.department?.name || "-",
    },
    {
      key: "is_active",
      header: "Status",
      render: (item: User) => (
        <Badge variant={item.is_active ? "success" : "default"}>
          {item.is_active ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Terdaftar",
      render: (item: User) => formatDate(item.created_at),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengguna</h1>
        <p className="text-[var(--muted-foreground)]">
          Kelola pengguna sistem
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari pengguna..."
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
        emptyMessage="Belum ada pengguna"
      />
    </div>
  );
}
