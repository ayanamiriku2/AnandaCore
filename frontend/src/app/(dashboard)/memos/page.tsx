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
import { formatDate } from "@/lib/utils";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Memo, PaginatedResponse } from "@/types";

export default function MemosPage() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Memo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Memo | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "normal",
  });

  const resetForm = () =>
    setForm({ title: "", content: "", priority: "normal" });

  const openEdit = (item: Memo) => {
    setForm({
      title: item.title || "",
      content: item.content || "",
      priority: item.priority || "normal",
    });
    setEditItem(item);
  };

  const { data, isLoading } = useQuery<PaginatedResponse<Memo>>({
    queryKey: ["memos", pagination.page, pagination.per_page, search],
    queryFn: () =>
      api
        .get("/memos", {
          params: {
            page: pagination.page,
            per_page: pagination.per_page,
            search: search || undefined,
          },
        })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/memos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memos"] });
      setShowCreate(false);
      resetForm();
      toast.success("Memo berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat memo"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: typeof form }) =>
      api.put(`/memos/${data.id}`, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memos"] });
      setEditItem(null);
      resetForm();
      toast.success("Memo berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui memo"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/memos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memos"] });
      setDeleteTarget(null);
      toast.success("Memo berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus memo"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, body: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Judul",
      render: (item: Memo) => <span className="font-medium">{item.title}</span>,
    },
    {
      key: "priority",
      header: "Prioritas",
      render: (item: Memo) => (
        <Badge
          variant={
            item.priority === "high"
              ? "danger"
              : item.priority === "normal"
                ? "info"
                : "default"
          }
        >
          {item.priority || "normal"}
        </Badge>
      ),
    },
    {
      key: "is_pinned",
      header: "Disematkan",
      render: (item: Memo) => (item.is_pinned ? "Ya" : "-"),
    },
    {
      key: "created_at",
      header: "Tanggal",
      render: (item: Memo) => formatDate(item.created_at),
    },
    {
      key: "actions",
      header: "",
      render: (item: Memo) => (
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
          <h1 className="text-2xl font-bold">Memo & Pengumuman</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola memo internal dan pengumuman
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Buat Memo
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari memo..."
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
        emptyMessage="Belum ada memo"
      />

      <Modal
        open={showCreate || !!editItem}
        onClose={() => { setShowCreate(false); setEditItem(null); resetForm(); }}
        title={editItem ? "Edit Memo" : "Buat Memo Baru"}
        size="lg"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Judul</label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Isi</label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="min-h-[120px]"
              required
            />
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
        title="Hapus Memo"
        message={`Memo "${deleteTarget?.title}" akan dihapus.`}
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
