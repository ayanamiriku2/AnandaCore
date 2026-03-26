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
  FolderPlus,
  Folder,
  Image,
  Video,
  FileText,
  FileArchive,
  Music,
  Download,
  X,
  Share2,
  Link2,
  Check,
  ChevronRight,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import type { MediaAlbum, MediaAsset } from "@/types";

function getAssetIcon(mediaType: string, mime?: string) {
  if (mediaType === "image") return <Image className="h-8 w-8 text-blue-400" />;
  if (mediaType === "video") return <Video className="h-8 w-8 text-purple-400" />;
  if (mediaType === "audio") return <Music className="h-8 w-8 text-orange-400" />;
  if (mime?.includes("zip") || mime?.includes("rar") || mime?.includes("7z") || mime?.includes("tar") || mime?.includes("gzip"))
    return <FileArchive className="h-8 w-8 text-yellow-500" />;
  return <FileText className="h-8 w-8 text-gray-400" />;
}

function getSmallAssetIcon(mediaType: string, mime?: string) {
  if (mediaType === "image") return <Image className="h-4 w-4 text-blue-400" />;
  if (mediaType === "video") return <Video className="h-4 w-4 text-purple-400" />;
  if (mediaType === "audio") return <Music className="h-4 w-4 text-orange-400" />;
  if (mime?.includes("zip") || mime?.includes("rar") || mime?.includes("7z") || mime?.includes("tar") || mime?.includes("gzip"))
    return <FileArchive className="h-4 w-4 text-yellow-500" />;
  return <FileText className="h-4 w-4 text-gray-400" />;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaAlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [showUpload, setShowUpload] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDeleteAsset, setShowDeleteAsset] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
  const [copiedAlbum, setCopiedAlbum] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [showCreateSubFolder, setShowCreateSubFolder] = useState(false);
  const [subFolderForm, setSubFolderForm] = useState({ title: "", description: "" });

  const { data: albumData, isLoading } = useQuery<{
    album: MediaAlbum;
    assets: MediaAsset[];
    sub_albums: MediaAlbum[];
    breadcrumbs: MediaAlbum[];
  }>({
    queryKey: ["media-album", id],
    queryFn: () => api.get(`/media/albums/${id}`).then((r) => r.data),
  });

  const album = albumData?.album;
  const assets = albumData?.assets;
  const subAlbums = albumData?.sub_albums ?? [];
  const breadcrumbs = albumData?.breadcrumbs ?? [];

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
      queryClient.invalidateQueries({ queryKey: ["media-albums"] });
      setShowUpload(false);
      setPendingFiles([]);
      toast.success("File berhasil diunggah");
    },
    onError: () => toast.error("Gagal mengunggah file"),
  });

  const updateAlbumMutation = useMutation({
    mutationFn: (data: typeof editForm) => api.put(`/media/albums/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-album", id] });
      queryClient.invalidateQueries({ queryKey: ["media-albums"] });
      setShowEdit(false);
      toast.success("Album berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui album"),
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: () => api.delete(`/media/albums/${id}`),
    onSuccess: () => {
      toast.success("Album berhasil dihapus");
      if (album?.parent_album_id) {
        router.push(`/media/${album.parent_album_id}`);
      } else {
        router.push("/media");
      }
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
      queryClient.invalidateQueries({ queryKey: ["media-albums"] });
      setShowDeleteAsset(null);
      toast.success("File berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus file"),
  });

  const createSubFolderMutation = useMutation({
    mutationFn: (data: typeof subFolderForm) =>
      api.post("/media/albums", { ...data, parent_album_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-album", id] });
      queryClient.invalidateQueries({ queryKey: ["media-albums"] });
      setShowCreateSubFolder(false);
      setSubFolderForm({ title: "", description: "" });
      toast.success("Sub-folder berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat sub-folder"),
  });

  const copyAlbumLink = () => {
    const url = `${window.location.origin}/share/media/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedAlbum(true);
      toast.success("Link album disalin ke clipboard");
      setTimeout(() => setCopiedAlbum(false), 2000);
    });
  };

  const copyAssetLink = (e: React.MouseEvent, asset: MediaAsset) => {
    e.stopPropagation();
    const url = `${window.location.origin}/api/files/${asset.file_path}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedAssetId(asset.id);
      toast.success("Link file disalin ke clipboard");
      setTimeout(() => setCopiedAssetId(null), 2000);
    });
  };

  if (isLoading) return <PageLoading />;
  if (!album) return <div className="p-6">Album tidak ditemukan</div>;

  const isDeleted = !!(album as MediaAlbum & { deleted_at?: string }).deleted_at;

  const openEdit = () => {
    setEditForm({ title: album.title, description: album.description || "" });
    setShowEdit(true);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 overflow-x-auto">
        <button
          onClick={() => router.push("/media")}
          className="flex items-center gap-1 hover:text-gray-900 whitespace-nowrap"
        >
          <Home className="h-4 w-4" />
          Media
        </button>
        {breadcrumbs.map((crumb, idx) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            {idx === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-900 whitespace-nowrap">{crumb.title}</span>
            ) : (
              <button
                onClick={() => router.push(`/media/${crumb.id}`)}
                className="hover:text-gray-900 whitespace-nowrap"
              >
                {crumb.title}
              </button>
            )}
          </span>
        ))}
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => {
              if (album.parent_album_id) {
                router.push(`/media/${album.parent_album_id}`);
              } else {
                router.push("/media");
              }
            }}
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
                <h1 className="text-xl sm:text-2xl font-bold">{album.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-sm text-gray-500">
                  {album.album_date && <span>{formatDate(album.album_date)}</span>}
                  {subAlbums.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Folder className="h-3.5 w-3.5" /> {subAlbums.length} folder
                    </span>
                  )}
                  <span>{assets?.length ?? 0} file</span>
                  {isDeleted && <Badge variant="danger">Dihapus</Badge>}
                </div>
              </div>
            </div>
            {album.description && (
              <p className="mt-2 ml-13 text-sm text-gray-600">{album.description}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isDeleted && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateSubFolder(true)}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Sub-Folder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAlbumLink}
              >
                {copiedAlbum ? (
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                {copiedAlbum ? "Tersalin" : "Bagikan"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={downloadingZip || !assets?.length}
                onClick={async () => {
                  setDownloadingZip(true);
                  try {
                    const response = await fetch(`/api/media/albums/${id}/download-zip`);
                    if (!response.ok) throw new Error("Download failed");
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const contentDisposition = response.headers.get("content-disposition");
                    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
                    const filename = filenameMatch ? filenameMatch[1] : `${album.title}.zip`;
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Album berhasil diunduh");
                  } catch {
                    toast.error("Gagal mengunduh album");
                  } finally {
                    setDownloadingZip(false);
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                {downloadingZip ? "Mengunduh..." : "Unduh ZIP"}
              </Button>
              <Button variant="outline" size="sm" onClick={openEdit}>
                Edit
              </Button>
              <Button size="sm" onClick={() => setShowUpload(true)}>
                <Upload className="mr-2 h-4 w-4" /> Unggah File
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

      {/* Sub-folders */}
      {subAlbums.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Folder</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {subAlbums.map((sub) => (
              <div
                key={sub.id}
                onClick={() => router.push(`/media/${sub.id}`)}
                className="group flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50">
                  <Folder className="h-5 w-5 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{sub.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {(sub.sub_album_count ?? 0) > 0 && (
                      <span>{sub.sub_album_count} folder</span>
                    )}
                    <span>{sub.asset_count ?? 0} file</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asset Grid */}
      {(assets && assets.length > 0) || subAlbums.length === 0 ? (
        <div>
          {subAlbums.length > 0 && assets && assets.length > 0 && (
            <h2 className="text-sm font-medium text-gray-500 mb-3">File</h2>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {assets && assets.length > 0 ? (
              assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative cursor-pointer rounded-lg border overflow-hidden"
                  onClick={() => setPreviewAsset(asset)}
                >
                  {asset.media_type === "image" && asset.file_path ? (
                    <div
                      className="aspect-square bg-gray-100 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(/api/files/${asset.file_path})`,
                      }}
                    />
                  ) : (
                    <div className="flex aspect-square flex-col items-center justify-center gap-2 bg-gray-50">
                      {getAssetIcon(asset.media_type, asset.file_mime || undefined)}
                      <span className="text-xs text-gray-400 uppercase">
                        {asset.file_name?.split(".").pop() || asset.media_type}
                      </span>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="truncate text-xs font-medium">
                      {asset.title || asset.file_name || "Untitled"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {getSmallAssetIcon(asset.media_type, asset.file_mime || undefined)}
                      <span className="text-xs text-gray-400">
                        {asset.file_size ? formatFileSize(asset.file_size) : asset.media_type}
                      </span>
                    </div>
                  </div>
                  {/* Actions overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {asset.file_path && (
                      <a
                        href={`/api/files/${asset.file_path}`}
                        className="rounded-full bg-white p-2 shadow hover:bg-gray-100"
                        download
                        onClick={(e) => e.stopPropagation()}
                        title="Unduh"
                      >
                        <Download className="h-4 w-4 text-gray-700" />
                      </a>
                    )}
                    <button
                      onClick={(e) => copyAssetLink(e, asset)}
                      className="rounded-full bg-white p-2 shadow hover:bg-gray-100"
                      title="Salin link"
                    >
                      {copiedAssetId === asset.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Link2 className="h-4 w-4 text-gray-700" />
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDeleteAsset(asset.id); }}
                      className="rounded-full bg-white p-2 shadow hover:bg-gray-100"
                      title="Hapus"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-sm text-gray-500">
                Belum ada file di album ini. Klik &quot;Unggah File&quot; untuk menambahkan atau buat sub-folder.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Create Sub-Folder Modal */}
      <Modal open={showCreateSubFolder} onClose={() => setShowCreateSubFolder(false)} title="Buat Sub-Folder">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSubFolderMutation.mutate(subFolderForm);
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nama Folder</label>
            <Input
              value={subFolderForm.title}
              onChange={(e) => setSubFolderForm({ ...subFolderForm, title: e.target.value })}
              placeholder="Contoh: Foto Kegiatan"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
            <Textarea
              value={subFolderForm.description}
              onChange={(e) => setSubFolderForm({ ...subFolderForm, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowCreateSubFolder(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={createSubFolderMutation.isPending}>
              {createSubFolderMutation.isPending ? "Membuat..." : "Buat Folder"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Unggah File" size="lg">
        <div className="space-y-4">
          <FileUpload
            onFilesSelected={(selected) => setPendingFiles(selected)}
            multiple
            maxSizeMB={100}
            label="Seret file ke sini atau klik untuk memilih (gambar, video, dokumen, arsip, dll)"
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
        message={`Album "${album.title}" dan semua file serta sub-folder di dalamnya akan dipindahkan ke sampah.`}
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteAlbumMutation.isPending}
      />

      {/* Delete Asset Confirm */}
      <ConfirmDialog
        open={!!showDeleteAsset}
        onClose={() => setShowDeleteAsset(null)}
        onConfirm={() => showDeleteAsset && deleteAssetMutation.mutate(showDeleteAsset)}
        title="Hapus File"
        message="File ini akan dihapus secara permanen."
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteAssetMutation.isPending}
      />

      {/* Preview Lightbox */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewAsset(null)}
        >
          <button
            onClick={() => setPreviewAsset(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {previewAsset.media_type === "image" && previewAsset.file_path ? (
              <img
                src={`/api/files/${previewAsset.file_path}`}
                alt={previewAsset.title || previewAsset.file_name || "Preview"}
                className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
              />
            ) : previewAsset.media_type === "video" && previewAsset.file_path ? (
              <video
                src={`/api/files/${previewAsset.file_path}`}
                controls
                autoPlay
                className="max-h-[85vh] max-w-[90vw] rounded-lg"
              />
            ) : previewAsset.media_type === "audio" && previewAsset.file_path ? (
              <div className="flex flex-col items-center gap-6 rounded-lg bg-white p-12">
                <Music className="h-16 w-16 text-orange-400" />
                <p className="text-sm font-medium">{previewAsset.title || previewAsset.file_name}</p>
                <audio src={`/api/files/${previewAsset.file_path}`} controls autoPlay className="w-80" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-12">
                {getAssetIcon(previewAsset.media_type, previewAsset.file_mime || undefined)}
                <p className="text-sm font-medium">{previewAsset.title || previewAsset.file_name}</p>
                {previewAsset.file_size && (
                  <p className="text-xs text-gray-400">{formatFileSize(previewAsset.file_size)}</p>
                )}
                {previewAsset.file_path && (
                  <a
                    href={`/api/files/${previewAsset.file_path}`}
                    download
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" /> Unduh File
                  </a>
                )}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between text-sm text-white/80">
              <span>{previewAsset.title || previewAsset.file_name || "Untitled"}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => copyAssetLink(e, previewAsset)}
                  className="flex items-center gap-1 rounded-md bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
                >
                  {copiedAssetId === previewAsset.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {copiedAssetId === previewAsset.id ? "Tersalin" : "Bagikan"}
                </button>
                {previewAsset.file_path && (
                  <a
                    href={`/api/files/${previewAsset.file_path}`}
                    download
                    className="flex items-center gap-1 rounded-md bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4" /> Unduh
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
