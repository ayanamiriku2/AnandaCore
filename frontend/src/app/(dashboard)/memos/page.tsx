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
import { formatDate } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Memo, PaginatedResponse } from "@/types";

export default function MemosPage() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "normal",
  });

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
      toast.success("Memo berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat memo"),
  });

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
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Buat Memo Baru"
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
