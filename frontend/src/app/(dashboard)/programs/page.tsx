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
import { usePagination } from "@/hooks/use-pagination";
import { formatDate, formatCurrency, statusColor } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Program, PaginatedResponse } from "@/types";

export default function ProgramsPage() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    status: "planning",
    start_date: "",
    end_date: "",
    budget: "",
  });

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
      toast.success("Program berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat program"),
  });

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
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tambah Program Baru"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              ...form,
              budget: form.budget ? Number(form.budget) : undefined,
            });
          }}
          className="space-y-4"
        >
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
