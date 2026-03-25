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
import { formatDate, statusColor } from "@/lib/utils";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Document, PaginatedResponse } from "@/types";

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [form, setForm] = useState({
    title: "",
    document_number: "",
    description: "",
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Document>>({
    queryKey: ["documents", pagination.page, pagination.per_page, search, statusFilter],
    queryFn: () =>
      api
        .get("/documents", {
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
    mutationFn: (data: typeof form) => api.post("/documents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setShowCreate(false);
      setForm({ title: "", document_number: "", description: "" });
      toast.success("Dokumen berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat dokumen"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/documents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setShowEdit(false);
      setEditingDoc(null);
      toast.success("Dokumen berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui dokumen"),
  });

  const columns = [
    { key: "document_number", header: "No. Dokumen" },
    { key: "title", header: "Judul", render: (item: Document) => (
      <span className="font-medium">{item.title}</span>
    )},
    { key: "category_name", header: "Kategori" },
    {
      key: "status",
      header: "Status",
      render: (item: Document) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(item.status)}`}>
          {item.status}
        </span>
      ),
    },
    { key: "version", header: "Versi", render: (item: Document) => `v${item.version}` },
    { key: "creator_name", header: "Dibuat Oleh" },
    {
      key: "created_at",
      header: "Tanggal",
      render: (item: Document) => formatDate(item.created_at),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (item: Document) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingDoc(item);
              setShowEdit(true);
            }}
            className="rounded p-1.5 hover:bg-gray-100"
            title="Edit"
          >
            <Pencil className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dokumen</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola arsip dan dokumen yayasan
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Dokumen
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari dokumen..."
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
          <option value="draft">Draft</option>
          <option value="active">Aktif</option>
          <option value="archived">Diarsipkan</option>
          <option value="verified">Terverifikasi</option>
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
        emptyMessage="Belum ada dokumen"
      />

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tambah Dokumen Baru"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Nomor Dokumen
            </label>
            <Input
              value={form.document_number}
              onChange={(e) =>
                setForm({ ...form, document_number: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Judul</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
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

      <Modal
        open={showEdit}
        onClose={() => { setShowEdit(false); setEditingDoc(null); }}
        title="Edit Dokumen"
        size="lg"
      >
        {editingDoc && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateMutation.mutate({
                id: editingDoc.id,
                data: {
                  title: formData.get("title") as string,
                  document_number: formData.get("document_number") as string,
                  description: formData.get("description") as string,
                  status: formData.get("status") as string,
                },
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nomor Dokumen</label>
              <Input name="document_number" defaultValue={editingDoc.document_number} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Judul</label>
              <Input name="title" defaultValue={editingDoc.title} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Status</label>
              <Select name="status" defaultValue={editingDoc.status}>
                <option value="draft">Draft</option>
                <option value="active">Aktif</option>
                <option value="archived">Diarsipkan</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
              <Textarea name="description" defaultValue={editingDoc.description || ""} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setShowEdit(false); setEditingDoc(null); }}>
                Batal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
