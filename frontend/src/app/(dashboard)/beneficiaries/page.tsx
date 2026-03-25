"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePagination } from "@/hooks/use-pagination";
import { formatDate, statusColor } from "@/lib/utils";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Beneficiary, PaginatedResponse } from "@/types";

export default function BeneficiariesPage() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Beneficiary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Beneficiary | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    nik: "",
    gender: "",
    birth_date: "",
    birth_place: "",
    address: "",
    phone: "",
    email: "",
    education_level: "",
    occupation: "",
  });

  const resetForm = () =>
    setForm({ full_name: "", nik: "", gender: "", birth_date: "", birth_place: "", address: "", phone: "", email: "", education_level: "", occupation: "" });

  const openEdit = (item: Beneficiary) => {
    setForm({
      full_name: item.full_name || "",
      nik: item.nik || "",
      gender: item.gender || "",
      birth_date: item.birth_date || "",
      birth_place: item.birth_place || "",
      address: item.address || "",
      phone: item.phone || "",
      email: item.email || "",
      education_level: item.education_level || "",
      occupation: item.occupation || "",
    });
    setEditItem(item);
  };

  const { data, isLoading } = useQuery<PaginatedResponse<Beneficiary>>({
    queryKey: ["beneficiaries", pagination.page, pagination.per_page, search],
    queryFn: () =>
      api
        .get("/beneficiaries", {
          params: {
            page: pagination.page,
            per_page: pagination.per_page,
            search: search || undefined,
          },
        })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/beneficiaries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      setShowCreate(false);
      resetForm();
      toast.success("Penerima manfaat berhasil ditambahkan");
    },
    onError: () => toast.error("Gagal menambahkan penerima manfaat"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: typeof form }) =>
      api.put(`/beneficiaries/${data.id}`, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      setEditItem(null);
      resetForm();
      toast.success("Penerima manfaat berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui penerima manfaat"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/beneficiaries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      setDeleteTarget(null);
      toast.success("Penerima manfaat berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus penerima manfaat"),
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
      key: "full_name",
      header: "Nama",
      render: (item: Beneficiary) => (
        <span className="font-medium">{item.full_name}</span>
      ),
    },
    { key: "nik", header: "NIK" },
    {
      key: "gender",
      header: "Jenis Kelamin",
      render: (item: Beneficiary) =>
        item.gender === "male"
          ? "Laki-laki"
          : item.gender === "female"
            ? "Perempuan"
            : "-",
    },
    { key: "phone", header: "Telepon" },
    { key: "education_level", header: "Pendidikan" },
    {
      key: "status",
      header: "Status",
      render: (item: Beneficiary) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(item.status)}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: "registered_date",
      header: "Terdaftar",
      render: (item: Beneficiary) => formatDate(item.registered_date),
    },
    {
      key: "actions",
      header: "",
      render: (item: Beneficiary) => (
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
          <h1 className="text-2xl font-bold">Penerima Manfaat</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola data penerima manfaat yayasan
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Penerima
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari penerima manfaat..."
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
        emptyMessage="Belum ada penerima manfaat"
      />

      <Modal
        open={showCreate || !!editItem}
        onClose={() => { setShowCreate(false); setEditItem(null); resetForm(); }}
        title={editItem ? "Edit Penerima Manfaat" : "Tambah Penerima Manfaat"}
        size="lg"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Nama Lengkap
              </label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">NIK</label>
              <Input
                value={form.nik}
                onChange={(e) => setForm({ ...form, nik: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Jenis Kelamin
              </label>
              <Select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Pilih</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Tempat Lahir
              </label>
              <Input
                value={form.birth_place}
                onChange={(e) =>
                  setForm({ ...form, birth_place: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Tanggal Lahir
              </label>
              <Input
                type="date"
                value={form.birth_date}
                onChange={(e) =>
                  setForm({ ...form, birth_date: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Telepon
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Alamat</label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
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
        title="Hapus Penerima Manfaat"
        message={`Penerima manfaat "${deleteTarget?.full_name}" akan dihapus.`}
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
