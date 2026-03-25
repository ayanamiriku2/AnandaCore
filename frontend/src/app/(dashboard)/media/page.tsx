"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { PageLoading } from "@/components/ui/loading";
import { Image, FolderOpen, Plus } from "lucide-react";
import { toast } from "sonner";

export default function MediaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  const { data: albums, isLoading } = useQuery({
    queryKey: ["media-albums"],
    queryFn: () => api.get("/media/albums").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/media/albums", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-albums"] });
      setShowCreate(false);
      setForm({ title: "", description: "" });
      toast.success("Album berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat album"),
  });

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Media</h1>
          <p className="text-[var(--muted-foreground)]">
            Galeri foto dan media kegiatan yayasan
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Buat Album
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {albums?.data?.length ? (
          albums.data.map(
            (album: {
              id: string;
              title?: string;
              name?: string;
              description?: string;
              asset_count?: number;
            }) => (
              <div
                key={album.id}
                onClick={() => router.push(`/media/${album.id}`)}
                className="cursor-pointer rounded-lg border bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-32 items-center justify-center rounded-lg bg-gray-100 mb-4">
                  <FolderOpen className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="font-medium">{album.title || album.name}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {album.description || "Tanpa deskripsi"}
                </p>
                <div className="flex items-center gap-1 mt-2 text-sm text-[var(--muted-foreground)]">
                  <Image className="h-3.5 w-3.5" />
                  {album.asset_count || 0} media
                </div>
              </div>
            )
          )
        ) : (
          <div className="col-span-full py-12 text-center text-[var(--muted-foreground)]">
            Belum ada album media
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Buat Album Baru">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Judul Album</label>
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
              {createMutation.isPending ? "Membuat..." : "Buat Album"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
