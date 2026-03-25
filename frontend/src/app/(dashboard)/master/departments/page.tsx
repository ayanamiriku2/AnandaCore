"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Department } from "@/types";

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });

  const resetForm = () => setForm({ name: "", code: "", description: "" });

  const openEdit = (item: Department) => {
    setForm({
      name: item.name || "",
      code: item.code || "",
      description: item.description || "",
    });
    setEditItem(item);
  };

  const { data, isLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => api.get("/master/departments").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/master/departments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setShowCreate(false);
      resetForm();
      toast.success("Departemen berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat departemen"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: typeof form }) =>
      api.put(`/master/departments/${data.id}`, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setEditItem(null);
      resetForm();
      toast.success("Departemen berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui departemen"),
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
    {
      key: "actions",
      header: "",
      render: (item: Department) => (
        <button
          onClick={(e) => { e.stopPropagation(); openEdit(item); }}
          className="rounded p-1 hover:bg-gray-100"
          title="Edit"
        >
          <Pencil className="h-4 w-4 text-gray-500" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departemen</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola departemen yayasan
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Departemen
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        isLoading={isLoading}
        emptyMessage="Belum ada departemen"
      />

      <Modal
        open={showCreate || !!editItem}
        onClose={() => { setShowCreate(false); setEditItem(null); resetForm(); }}
        title={editItem ? "Edit Departemen" : "Tambah Departemen Baru"}
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
            <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
    </div>
  );
}
