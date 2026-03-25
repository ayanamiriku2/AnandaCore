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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/types";

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", display_name: "", description: "" });

  const resetForm = () => setForm({ name: "", display_name: "", description: "" });

  const { data, isLoading } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => api.get("/master/roles").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/master/roles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setShowCreate(false);
      resetForm();
      toast.success("Peran berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat peran"),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Peran & Hak Akses</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola peran dan izin pengguna
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Peran
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        isLoading={isLoading}
        emptyMessage="Belum ada peran"
      />

      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); resetForm(); }}
        title="Tambah Peran Baru"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kode</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. admin"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Tampilan</label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="e.g. Administrator"
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
            <Button type="button" variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
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
