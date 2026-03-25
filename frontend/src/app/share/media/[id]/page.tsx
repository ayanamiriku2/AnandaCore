"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  FolderOpen,
  Image,
  Video,
  FileText,
  FileArchive,
  Music,
  Download,
  X,
  ArrowLeft,
} from "lucide-react";
import type { MediaAlbum, MediaAsset } from "@/types";

function getAssetIcon(mediaType: string, mime?: string) {
  if (mediaType === "image") return <Image className="h-8 w-8 text-blue-400" />;
  if (mediaType === "video") return <Video className="h-8 w-8 text-purple-400" />;
  if (mediaType === "audio") return <Music className="h-8 w-8 text-orange-400" />;
  if (mime?.includes("zip") || mime?.includes("rar") || mime?.includes("7z") || mime?.includes("tar") || mime?.includes("gzip"))
    return <FileArchive className="h-8 w-8 text-yellow-500" />;
  return <FileText className="h-8 w-8 text-gray-400" />;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PublicAlbumPage() {
  const params = useParams();
  const id = params.id as string;
  const [album, setAlbum] = useState<MediaAlbum | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);

  useEffect(() => {
    async function loadAlbum() {
      try {
        const res = await api.get(`/media/albums/${id}/public`);
        setAlbum(res.data.album);
        setAssets(res.data.assets || []);
      } catch {
        setError("Album tidak ditemukan atau tidak dapat diakses.");
      } finally {
        setLoading(false);
      }
    }
    loadAlbum();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Memuat album...</p>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">{error || "Album tidak ditemukan"}</p>
          <a
            href="/"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Kembali ke beranda
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
              <FolderOpen className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">{album.title}</h1>
              {album.description && (
                <p className="mt-0.5 text-sm text-gray-500">{album.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {assets.length} file &middot; Dibagikan dari AnandaCore
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assets.length > 0 ? (
            assets.map((asset) => (
              <div
                key={asset.id}
                className="group relative cursor-pointer overflow-hidden rounded-lg border bg-white"
                onClick={() => setPreviewAsset(asset)}
              >
                {asset.media_type === "image" && asset.file_path ? (
                  <div
                    className="aspect-square bg-gray-100 bg-cover bg-center"
                    style={{ backgroundImage: `url(/api/files/${asset.file_path})` }}
                  />
                ) : (
                  <div className="flex aspect-square flex-col items-center justify-center gap-2 bg-gray-50">
                    {getAssetIcon(asset.media_type, asset.file_mime || undefined)}
                    <span className="text-xs uppercase text-gray-400">
                      {asset.file_name?.split(".").pop() || asset.media_type}
                    </span>
                  </div>
                )}
                <div className="p-2">
                  <p className="truncate text-xs font-medium">
                    {asset.title || asset.file_name || "Untitled"}
                  </p>
                  {asset.file_size && (
                    <p className="text-xs text-gray-400">{formatFileSize(asset.file_size)}</p>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {asset.file_path && (
                    <a
                      href={`/api/files/${asset.file_path}`}
                      className="rounded-full bg-white p-2.5 shadow hover:bg-gray-100"
                      download
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="h-5 w-5 text-gray-700" />
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-sm text-gray-500">
              Album ini belum memiliki file.
            </div>
          )}
        </div>
      </div>

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
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
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
      )}
    </div>
  );
}
