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
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Task, PaginatedResponse } from "@/types";

export default function TasksPage() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    due_date: "",
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Task>>({
    queryKey: ["tasks", pagination.page, pagination.per_page, search, statusFilter],
    queryFn: () =>
      api
        .get("/tasks", {
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
    mutationFn: (data: typeof form) => api.post("/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowCreate(false);
      toast.success("Tugas berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat tugas"),
  });

  const priorityBadge = (p: string) => {
    const map: Record<string, "default" | "warning" | "danger" | "info"> = {
      low: "default",
      medium: "info",
      high: "warning",
      critical: "danger",
    };
    return map[p] || "default";
  };

  const columns = [
    {
      key: "title",
      header: "Judul",
      render: (item: Task) => <span className="font-medium">{item.title}</span>,
    },
    { key: "assignee_name", header: "Ditugaskan" },
    {
      key: "priority",
      header: "Prioritas",
      render: (item: Task) => (
        <Badge variant={priorityBadge(item.priority)}>{item.priority}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Task) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(item.status)}`}>
          {item.status}
        </span>
      ),
    },
    { key: "program_name", header: "Program" },
    {
      key: "due_date",
      header: "Tenggat",
      render: (item: Task) =>
        item.due_date ? formatDate(item.due_date) : "-",
    },
    {
      key: "created_at",
      header: "Dibuat",
      render: (item: Task) => formatDate(item.created_at),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tugas</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola tugas dan penugasan
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Tugas
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari tugas..."
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
          <option value="pending">Pending</option>
          <option value="in_progress">Berjalan</option>
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
        emptyMessage="Belum ada tugas"
      />

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tambah Tugas Baru"
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Prioritas
              </label>
              <Select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
                <option value="critical">Kritis</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Status
              </label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">Berjalan</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Tenggat
              </label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
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
