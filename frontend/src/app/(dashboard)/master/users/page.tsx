"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePagination } from "@/hooks/use-pagination";
import { formatDate } from "@/lib/utils";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { User, PaginatedResponse } from "@/types";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", is_active: true });

  const openEdit = (item: User) => {
    setEditForm({
      full_name: item.full_name || "",
      phone: item.phone || "",
      is_active: item.is_active ?? true,
    });
    setEditItem(item);
  };

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

  const createMutation = useMutation({
    mutationFn: (data: typeof createForm) => api.post("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowCreate(false);
      setCreateForm({ email: "", password: "", full_name: "", phone: "" });
      toast.success("Pengguna berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat pengguna"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: typeof editForm }) =>
      api.put(`/users/${data.id}`, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditItem(null);
      toast.success("Pengguna berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui pengguna"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteTarget(null);
      toast.success("Pengguna berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus pengguna"),
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
    {
      key: "actions",
      header: "",
      render: (item: User) => (
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
          <h1 className="text-2xl font-bold">Pengguna</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola pengguna sistem
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
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

      {/* Create User Modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setCreateForm({ email: "", password: "", full_name: "", phone: "" }); }}
        title="Tambah Pengguna Baru"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(createForm); }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nama Lengkap</label>
            <Input
              value={createForm.full_name}
              onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <Input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Telepon</label>
            <Input
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
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

      {/* Edit User Modal */}
      <Modal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        title="Edit Pengguna"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); editItem && updateMutation.mutate({ id: editItem.id, body: editForm }); }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nama Lengkap</label>
            <Input
              value={editForm.full_name}
              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Telepon</label>
            <Input
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={editForm.is_active}
              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="is_active" className="text-sm font-medium">Aktif</label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setEditItem(null)}>
              Batal
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Hapus Pengguna"
        message={`Pengguna "${deleteTarget?.full_name}" akan dihapus.`}
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
