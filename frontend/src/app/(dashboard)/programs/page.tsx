"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePagination } from "@/hooks/use-pagination";
import { formatDate, formatCurrency, statusColor } from "@/lib/utils";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Program, PaginatedResponse } from "@/types";

export default function ProgramsPage() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Program | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    status: "planning",
    start_date: "",
    end_date: "",
    budget: "",
  });

  const resetForm = () =>
    setForm({ name: "", code: "", description: "", status: "planning", start_date: "", end_date: "", budget: "" });

  const openEdit = (item: Program) => {
    setForm({
      name: item.name,
      code: item.code || "",
      description: item.description || "",
      status: item.status || "planning",
      start_date: item.start_date || "",
      end_date: item.end_date || "",
      budget: item.budget ? String(item.budget) : "",
    });
    setEditItem(item);
  };

  const { data, isLoading } = useQuery<PaginatedResponse<Program>>({
    queryKey: ["programs", pagination.page, pagination.per_page, search, statusFilter],
    queryFn: () =>
      api
        .get("/programs", {
          params: {
            page: pagination.page,
            per_page: pagination.per_page,
            search: search || undefined,
            status: statusFilter || undefined,
          },
        })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/programs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      setShowCreate(false);
      resetForm();
      toast.success("Program berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat program"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: Record<string, unknown> }) =>
      api.put(`/programs/${data.id}`, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      setEditItem(null);
      resetForm();
      toast.success("Program berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui program"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/programs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      setDeleteTarget(null);
      toast.success("Program berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus program"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      budget: form.budget ? Number(form.budget) : undefined,
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    { key: "code", header: "Kode" },
    {
      key: "name",
      header: "Nama Program",
      render: (item: Program) => <span className="font-medium">{item.name}</span>,
    },
    { key: "program_type_name", header: "Tipe" },
    {
      key: "status",
      header: "Status",
      render: (item: Program) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(item.status)}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: "budget",
      header: "Anggaran",
      render: (item: Program) =>
        item.budget ? formatCurrency(item.budget) : "-",
    },
    { key: "pic_name", header: "PIC" },
    {
      key: "start_date",
      header: "Tanggal Mulai",
      render: (item: Program) =>
        item.start_date ? formatDate(item.start_date) : "-",
    },
    {
      key: "actions",
      header: "",
      render: (item: Program) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Program</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola program dan proyek yayasan
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Program
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari program..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        >
          <option value="">Semua Status</option>
          <option value="planning">Perencanaan</option>
          <option value="active">Aktif</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        page={data?.page}
        totalPages={data?.total_pages}
        total={data?.total}
        onPageChange={pagination.setPage}
        emptyMessage="Belum ada program"
      />

      <Modal
        open={showCreate || !!editItem}
        onClose={() => { setShowCreate(false); setEditItem(null); resetForm(); }}
        title={editItem ? "Edit Program" : "Tambah Program Baru"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kode</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama</label>
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
                Tanggal Mulai
              </label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Tanggal Selesai
              </label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Anggaran (Rp)
              </label>
              <Input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
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
            <Button
              type="submit"
              disabled={editItem ? updateMutation.isPending : createMutation.isPending}
            >
              {(editItem ? updateMutation.isPending : createMutation.isPending)
                ? "Menyimpan..."
                : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Hapus Program"
        message={`Program "${deleteTarget?.name}" akan dihapus.`}
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
