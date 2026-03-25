"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { usePagination } from "@/hooks/use-pagination";
import { formatDate, formatCurrency, statusColor } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Asset, PaginatedResponse } from "@/types";

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    asset_code: "",
    name: "",
    description: "",
    condition: "good",
    acquisition_date: "",
    acquisition_value: "",
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Asset>>({
    queryKey: ["assets", pagination.page, pagination.per_page, search],
    queryFn: () =>
      api
        .get("/assets", {
          params: {
            page: pagination.page,
            per_page: pagination.per_page,
            search: search || undefined,
          },
        })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/assets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setShowCreate(false);
      toast.success("Aset berhasil ditambahkan");
    },
    onError: () => toast.error("Gagal menambahkan aset"),
  });

  const conditionBadge = (c: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
      good: "success",
      fair: "info",
      poor: "warning",
      damaged: "danger",
      disposed: "default",
    };
    return map[c] || "default";
  };

  const columns = [
    { key: "asset_code", header: "Kode Aset" },
    {
      key: "name",
      header: "Nama Aset",
      render: (item: Asset) => <span className="font-medium">{item.name}</span>,
    },
    { key: "category_name", header: "Kategori" },
    { key: "location_name", header: "Lokasi" },
    {
      key: "condition",
      header: "Kondisi",
      render: (item: Asset) => (
        <Badge variant={conditionBadge(item.condition)}>{item.condition}</Badge>
      ),
    },
    {
      key: "acquisition_value",
      header: "Nilai",
      render: (item: Asset) =>
        item.acquisition_value
          ? formatCurrency(Number(item.acquisition_value))
          : "-",
    },
    {
      key: "status",
      header: "Status",
      render: (item: Asset) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(item.status)}`}>
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aset</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola inventaris dan aset yayasan
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Aset
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari aset..."
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
        emptyMessage="Belum ada aset"
      />

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tambah Aset Baru"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              ...form,
              acquisition_value: form.acquisition_value
                ? Number(form.acquisition_value)
                : undefined,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Kode Aset
              </label>
              <Input
                value={form.asset_code}
                onChange={(e) =>
                  setForm({ ...form, asset_code: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Nama Aset
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Deskripsi
            </label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Kondisi
              </label>
              <Select
                value={form.condition}
                onChange={(e) =>
                  setForm({ ...form, condition: e.target.value })
                }
              >
                <option value="good">Baik</option>
                <option value="fair">Cukup</option>
                <option value="poor">Buruk</option>
                <option value="damaged">Rusak</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Tanggal Perolehan
              </label>
              <Input
                type="date"
                value={form.acquisition_date}
                onChange={(e) =>
                  setForm({ ...form, acquisition_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Nilai (Rp)
              </label>
              <Input
                type="number"
                value={form.acquisition_value}
                onChange={(e) =>
                  setForm({ ...form, acquisition_value: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreate(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
