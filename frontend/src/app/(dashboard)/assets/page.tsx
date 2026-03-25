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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePagination } from "@/hooks/use-pagination";
import { formatDate, formatCurrency, statusColor } from "@/lib/utils";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Asset, PaginatedResponse } from "@/types";

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [form, setForm] = useState({
    asset_code: "",
    name: "",
    description: "",
    condition: "good",
    acquisition_date: "",
    acquisition_value: "",
  });

  const resetForm = () =>
    setForm({ asset_code: "", name: "", description: "", condition: "good", acquisition_date: "", acquisition_value: "" });

  const openEdit = (item: Asset) => {
    setForm({
      asset_code: item.asset_code || "",
      name: item.name || "",
      description: item.description || "",
      condition: item.condition || "good",
      acquisition_date: item.acquisition_date || "",
      acquisition_value: item.acquisition_value ? String(item.acquisition_value) : "",
    });
    setEditItem(item);
  };

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
      resetForm();
      toast.success("Aset berhasil ditambahkan");
    },
    onError: () => toast.error("Gagal menambahkan aset"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: Record<string, unknown> }) =>
      api.put(`/assets/${data.id}`, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setEditItem(null);
      resetForm();
      toast.success("Aset berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui aset"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setDeleteTarget(null);
      toast.success("Aset berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus aset"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      acquisition_value: form.acquisition_value ? Number(form.acquisition_value) : undefined,
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

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
    {
      key: "actions",
      header: "",
      render: (item: Asset) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(item); }}
            className="rounded p-1 hover:bg-gray-100"
            title="Edit"
          >
            <Pencil className="h-4 w-4 text-gray-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
            className="rounded p-1 hover:bg-gray-100"
            title="Hapus"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Aset</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola inventaris dan aset yayasan
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Aset
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
        open={showCreate || !!editItem}
        onClose={() => { setShowCreate(false); setEditItem(null); resetForm(); }}
        title={editItem ? "Edit Aset" : "Tambah Aset Baru"}
        size="lg"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              onClick={() => { setShowCreate(false); setEditItem(null); resetForm(); }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={editItem ? updateMutation.isPending : createMutation.isPending}>
              {(editItem ? updateMutation.isPending : createMutation.isPending) ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Hapus Aset"
        message={`Aset "${deleteTarget?.name}" akan dihapus.`}
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
