"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { formatDate, statusColor } from "@/lib/utils";
import { Plus, Search, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Document, PaginatedResponse } from "@/types";

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pagination = usePagination();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDeleteTarget(null);
      toast.success("Dokumen berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus dokumen"),
  });

  const columns = [
    {
      key: "title",
      header: "Dokumen",
      render: (item: Document) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <FileText className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <div>
            <p className="font-medium">{item.title}</p>
            {item.document_number && (
              <p className="text-xs text-gray-500 font-mono">{item.document_number}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Document) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(item.status)}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: "file_name",
      header: "File",
      render: (item: Document) =>
        item.file_name ? (
          <span className="text-xs text-gray-600">{item.file_name}</span>
        ) : (
          <span className="text-xs text-gray-400">Belum ada file</span>
        ),
    },
    {
      key: "verification_status",
      header: "Verifikasi",
      render: (item: Document) =>
        item.verification_status === "terverifikasi" ? (
          <Badge variant="success">Terverifikasi</Badge>
        ) : (
          <Badge variant="default">Belum</Badge>
        ),
    },
    {
      key: "created_at",
      header: "Tanggal",
      render: (item: Document) => formatDate(item.created_at),
    },
    {
      key: "actions",
      header: "",
      render: (item: Document) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(item);
          }}
          className="rounded p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500"
          title="Hapus"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dokumen</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola arsip dan dokumen yayasan
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Dokumen
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
          className="w-full sm:w-40"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="active">Aktif</option>
          <option value="archived">Diarsipkan</option>
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
        onRowClick={(item) => router.push(`/documents/${item.id}`)}
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
            <label className="mb-1.5 block text-sm font-medium">Nomor Dokumen</label>
            <Input
              value={form.document_number}
              onChange={(e) => setForm({ ...form, document_number: e.target.value })}
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
            <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Hapus Dokumen"
        message={`Dokumen "${deleteTarget?.title}" akan dipindahkan ke sampah. Anda dapat memulihkannya nanti.`}
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
