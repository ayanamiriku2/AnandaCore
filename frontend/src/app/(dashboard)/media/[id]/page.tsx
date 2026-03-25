"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { PageLoading } from "@/components/ui/loading";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  Upload,
  FolderOpen,
  Image,
  Video,
  Film,
  Download,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { MediaAlbum, MediaAsset } from "@/types";

export default function MediaAlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [showUpload, setShowUpload] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDeleteAsset, setShowDeleteAsset] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [editForm, setEditForm] = useState({ title: "", description: "" });

  const { data: albumData, isLoading } = useQuery<{ album: MediaAlbum; assets: MediaAsset[] }>({
    queryKey: ["media-album", id],
    queryFn: () => api.get(`/media/albums/${id}`).then((r) => r.data),
  });

  const album = albumData?.album;
  const assets = albumData?.assets;

  const uploadMutation = useMutation({
    mutationFn: async (fileList: File[]) => {
      for (const file of fileList) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/media/albums/${id}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-album", id] });
      setShowUpload(false);
      setPendingFiles([]);
      toast.success("Media berhasil diunggah");
    },
    onError: () => toast.error("Gagal mengunggah media"),
  });

  const updateAlbumMutation = useMutation({
    mutationFn: (data: typeof editForm) => api.put(`/media/albums/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-album", id] });
      setShowEdit(false);
      toast.success("Album berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui album"),
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: () => api.delete(`/media/albums/${id}`),
    onSuccess: () => {
      toast.success("Album berhasil dihapus");
      router.push("/media");
    },
    onError: () => toast.error("Gagal menghapus album"),
  });

  const restoreAlbumMutation = useMutation({
    mutationFn: () => api.post(`/media/albums/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-album", id] });
      toast.success("Album berhasil dipulihkan");
    },
    onError: () => toast.error("Gagal memulihkan album"),
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (assetId: string) => api.delete(`/media/assets/${assetId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-album", id] });
      setShowDeleteAsset(null);
      toast.success("Media berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus media"),
  });

  if (isLoading) return <PageLoading />;
  if (!album) return <div className="p-6">Album tidak ditemukan</div>;

  const isDeleted = !!(album as MediaAlbum & { deleted_at?: string }).deleted_at;

  const assetIcon = (type: string) => {
    if (type === "video") return <Video className="h-8 w-8 text-purple-400" />;
    if (type === "image") return <Image className="h-8 w-8 text-blue-400" />;
    return <Film className="h-8 w-8 text-gray-400" />;
  };

  const openEdit = () => {
    setEditForm({ title: album.title, description: album.description || "" });
    setShowEdit(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push("/media")}
            className="mt-1 rounded-md p-1.5 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                <FolderOpen className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{album.title}</h1>
                <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
                  {album.album_date && <span>{formatDate(album.album_date)}</span>}
                  <span>{assets?.length ?? 0} media</span>
                  {isDeleted && <Badge variant="danger">Dihapus</Badge>}
                </div>
              </div>
            </div>
            {album.description && (
              <p className="mt-2 ml-13 text-sm text-gray-600">{album.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDeleted && (
            <>
              <Button variant="outline" onClick={openEdit}>
                Edit
              </Button>
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="mr-2 h-4 w-4" /> Unggah Media
              </Button>
              <button
                onClick={() => setShowDelete(true)}
                className="rounded-md p-2 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          {isDeleted && (
            <Button onClick={() => restoreAlbumMutation.mutate()} disabled={restoreAlbumMutation.isPending}>
              <RotateCcw className="mr-2 h-4 w-4" /> Pulihkan
            </Button>
          )}
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {assets && assets.length > 0 ? (
          assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative rounded-lg border overflow-hidden"
            >
              {asset.media_type === "image" && asset.file_path ? (
                <div
                  className="aspect-square bg-gray-100 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(/api/media/assets/${asset.id}/download)`,
                  }}
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-gray-50">
                  {assetIcon(asset.media_type)}
                </div>
              )}
              <div className="p-2">
                <p className="truncate text-xs font-medium">
                  {asset.title || asset.file_name || "Untitled"}
                </p>
                <p className="text-xs text-gray-400">{asset.media_type}</p>
              </div>
              {/* Actions overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {asset.file_path && (
                  <a
                    href={`/api/media/assets/${asset.id}/download`}
                    className="rounded-full bg-white p-2 shadow hover:bg-gray-100"
                    download
                  >
                    <Download className="h-4 w-4 text-gray-700" />
                  </a>
                )}
                <button
                  onClick={() => setShowDeleteAsset(asset.id)}
                  className="rounded-full bg-white p-2 shadow hover:bg-gray-100"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-sm text-gray-500">
            Belum ada media di album ini
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Unggah Media" size="lg">
        <div className="space-y-4">
          <FileUpload
            onFilesSelected={(selected) => setPendingFiles(selected)}
            accept="image/*,video/*"
            multiple
            maxSizeMB={50}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowUpload(false)}>
              Batal
            </Button>
            <Button
              onClick={() => uploadMutation.mutate(pendingFiles)}
              disabled={pendingFiles.length === 0 || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Mengunggah..." : `Unggah ${pendingFiles.length} File`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Album Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Album">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateAlbumMutation.mutate(editForm);
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Judul</label>
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
            <Textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={updateAlbumMutation.isPending}>
              {updateAlbumMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Album Confirm */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => deleteAlbumMutation.mutate()}
        title="Hapus Album"
        message={`Album "${album.title}" dan semua medianya akan dipindahkan ke sampah.`}
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteAlbumMutation.isPending}
      />

      {/* Delete Asset Confirm */}
      <ConfirmDialog
        open={!!showDeleteAsset}
        onClose={() => setShowDeleteAsset(null)}
        onConfirm={() => showDeleteAsset && deleteAssetMutation.mutate(showDeleteAsset)}
        title="Hapus Media"
        message="Media ini akan dihapus secara permanen."
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteAssetMutation.isPending}
      />
    </div>
  );
}
