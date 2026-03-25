"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { usePagination } from "@/hooks/use-pagination";
import { formatDate, statusColor } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Letter, PaginatedResponse } from "@/types";

export default function LettersPage() {
  return (
    <Suspense fallback={<div>Memuat...</div>}>
      <LettersContent />
    </Suspense>
  );
}

function LettersContent() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlType = searchParams.get("type");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(
    urlType === "incoming" ? "masuk" : urlType === "outgoing" ? "keluar" : ""
  );
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    letter_number: "",
    subject: "",
    letter_type: "masuk",
    sender: "",
    recipient: "",
    letter_date: "",
    attachment_notes: "",
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Letter>>({
    queryKey: ["letters", pagination.page, pagination.per_page, search, typeFilter],
    queryFn: () =>
      api
        .get("/letters", {
          params: {
            page: pagination.page,
            per_page: pagination.per_page,
            search: search || undefined,
            letter_type: typeFilter || undefined,
          },
        })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload: Record<string, unknown> = {
        letter_type: data.letter_type,
        subject: data.subject,
        letter_number: data.letter_number || undefined,
        sender: data.sender || undefined,
        recipient: data.recipient || undefined,
        letter_date: data.letter_date || undefined,
        attachment_notes: data.attachment_notes || undefined,
      };
      return api.post("/letters", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      setShowCreate(false);
      toast.success("Surat berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat surat"),
  });

  const priorityBadge = (p: string) => {
    const map: Record<string, "default" | "warning" | "danger" | "info"> = {
      low: "default",
      normal: "info",
      high: "warning",
      urgent: "danger",
    };
    return map[p] || "default";
  };

  const columns = [
    { key: "letter_number", header: "No. Surat" },
    { key: "subject", header: "Perihal", render: (item: Letter) => (
      <span className="font-medium">{item.subject}</span>
    )},
    {
      key: "letter_type",
      header: "Tipe",
      render: (item: Letter) => (
        <Badge variant={item.letter_type === "masuk" ? "info" : "success"}>
          {item.letter_type === "masuk" ? "Masuk" : "Keluar"}
        </Badge>
      ),
    },
    { key: "sender", header: "Pengirim" },
    {
      key: "status",
      header: "Status",
      render: (item: Letter) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(item.status)}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: "letter_date",
      header: "Tanggal Surat",
      render: (item: Letter) =>
        item.letter_date ? formatDate(item.letter_date) : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Surat</h1>
          <p className="text-[var(--muted-foreground)]">
            Kelola surat masuk dan surat keluar
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Surat
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari surat..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-40"
        >
          <option value="">Semua Tipe</option>
          <option value="masuk">Surat Masuk</option>
          <option value="keluar">Surat Keluar</option>
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
        onRowClick={(item) => router.push(`/letters/${item.id}`)}
        emptyMessage="Belum ada surat"
      />

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tambah Surat Baru"
        size="lg"
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
              <label className="mb-1.5 block text-sm font-medium">
                Nomor Surat
              </label>
              <Input
                value={form.letter_number}
                onChange={(e) =>
                  setForm({ ...form, letter_number: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tipe</label>
              <Select
                value={form.letter_type}
                onChange={(e) =>
                  setForm({ ...form, letter_type: e.target.value })
                }
              >
                <option value="masuk">Surat Masuk</option>
                <option value="keluar">Surat Keluar</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Perihal</label>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Pengirim
              </label>
              <Input
                value={form.sender}
                onChange={(e) => setForm({ ...form, sender: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Penerima
              </label>
              <Input
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Tanggal Surat
              </label>
              <Input
                type="date"
                value={form.letter_date}
                onChange={(e) =>
                  setForm({ ...form, letter_date: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Catatan Lampiran
            </label>
            <Textarea
              value={form.attachment_notes}
              onChange={(e) =>
                setForm({ ...form, attachment_notes: e.target.value })
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
    </div>
  );
}
