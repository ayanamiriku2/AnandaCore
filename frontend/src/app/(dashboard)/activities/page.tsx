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
import { formatDate, statusColor } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Activity, PaginatedResponse } from "@/types";

export default function ActivitiesPage() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "planned",
    start_date: "",
    end_date: "",
    location: "",
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Activity>>({
    queryKey: ["activities", pagination.page, pagination.per_page, search],
    queryFn: () =>
      api
        .get("/activities", {
          params: {
            page: pagination.page,
            per_page: pagination.per_page,
            search: search || undefined,
          },
        })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/activities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      setShowCreate(false);
      toast.success("Kegiatan berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat kegiatan"),
  });

  const columns = [
    {
      key: "name",
      header: "Nama Kegiatan",
      render: (item: Activity) => <span className="font-medium">{item.name}</span>,
    },
    { key: "program_name", header: "Program" },
    { key: "activity_type_name", header: "Tipe" },
    {
      key: "status",
      header: "Status",
      render: (item: Activity) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(item.status)}`}>
          {item.status}
        </span>
      ),
    },
    { key: "location", header: "Lokasi" },
    {
      key: "participant_count",
      header: "Peserta",
      render: (item: Activity) => item.participant_count ?? "-",
    },
    {
      key: "start_date",
      header: "Tanggal",
      render: (item: Activity) =>
        item.start_date ? formatDate(item.start_date) : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kegiatan</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola kegiatan dan aktivitas yayasan
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Kegiatan
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari kegiatan..."
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
        emptyMessage="Belum ada kegiatan"
      />

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tambah Kegiatan Baru"
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
              Nama Kegiatan
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Lokasi</label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
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
    </div>
  );
}
