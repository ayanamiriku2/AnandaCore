"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  FolderOpen,
  Image,
  Video,
  FileText,
  FileArchive,
  FileSpreadsheet,
  Music,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Archive,
} from "lucide-react";
import type { MediaAlbum, MediaAsset } from "@/types";

function getAssetIcon(mediaType: string, mime?: string) {
  if (mediaType === "image") return <Image className="h-8 w-8 text-blue-400" />;
  if (mediaType === "video") return <Video className="h-8 w-8 text-purple-400" />;
  if (mediaType === "audio") return <Music className="h-8 w-8 text-orange-400" />;
  if (mime?.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
  if (mime?.includes("spreadsheet") || mime?.includes("excel") || mime?.includes("csv"))
    return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
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

function isPreviewable(asset: MediaAsset): boolean {
  const mime = asset.file_mime || "";
  return (
    asset.media_type === "image" ||
    asset.media_type === "video" ||
    asset.media_type === "audio" ||
    mime.includes("pdf")
  );
}

function isDocumentPreviewable(mime?: string): boolean {
  if (!mime) return false;
  return mime.includes("pdf");
}

function isOfficeDocument(mime?: string): boolean {
  if (!mime) return false;
  return (
    mime.includes("word") ||
    mime.includes("document") ||
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime.includes("presentation") ||
    mime.includes("powerpoint") ||
    mime.includes("csv") ||
    mime.includes("rtf")
  );
}

export default function PublicAlbumClient() {
  const params = useParams();
  const id = params.id as string;
  const [album, setAlbum] = useState<MediaAlbum | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

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

  // Previewable assets for slider navigation
  const previewableAssets = assets.filter((a) => isPreviewable(a));

  const currentAsset = lightboxIndex !== null ? assets[lightboxIndex] : null;

  // Find prev/next previewable asset indices for slider
  const currentPreviewIdx = currentAsset
    ? previewableAssets.findIndex((a) => a.id === currentAsset.id)
    : -1;

  const goToPrev = useCallback(() => {
    if (currentPreviewIdx > 0) {
      const prevAsset = previewableAssets[currentPreviewIdx - 1];
      const idx = assets.findIndex((a) => a.id === prevAsset.id);
      setLightboxIndex(idx);
    }
  }, [currentPreviewIdx, previewableAssets, assets]);

  const goToNext = useCallback(() => {
    if (currentPreviewIdx < previewableAssets.length - 1) {
      const nextAsset = previewableAssets[currentPreviewIdx + 1];
      const idx = assets.findIndex((a) => a.id === nextAsset.id);
      setLightboxIndex(idx);
    }
  }, [currentPreviewIdx, previewableAssets, assets]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      else if (e.key === "ArrowRight") goToNext();
      else if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, goToPrev, goToNext]);

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/media/albums/${id}/download-zip`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${album?.title || "album"}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengunduh file. Silakan coba lagi.");
    } finally {
      setDownloading(false);
    }
  };

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            {assets.length > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={downloading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Mengunduh...
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    Unduh Semua (ZIP)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assets.length > 0 ? (
            assets.map((asset, idx) => (
              <div
                key={asset.id}
                className="group relative cursor-pointer overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
                onClick={() => setLightboxIndex(idx)}
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
                <div className="flex items-center justify-between gap-1 p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {asset.title || asset.file_name || "Untitled"}
                    </p>
                    {asset.file_size && (
                      <p className="text-xs text-gray-400">{formatFileSize(asset.file_size)}</p>
                    )}
                  </div>
                  {asset.file_path && (
                    <a
                      href={`/api/files/${asset.file_path}`}
                      className="flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      download
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Unduh"
                    >
                      <Download className="h-4 w-4" />
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

      {/* Lightbox / Preview with Slider */}
      {lightboxIndex !== null && currentAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          {previewableAssets.length > 1 && currentPreviewIdx >= 0 && (
            <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white">
              {currentPreviewIdx + 1} / {previewableAssets.length}
            </div>
          )}

          {/* Previous button */}
          {currentPreviewIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 sm:left-4"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Next button */}
          {currentPreviewIdx < previewableAssets.length - 1 && currentPreviewIdx >= 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 sm:right-4"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Content */}
          <div
            className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image preview */}
            {currentAsset.media_type === "image" && currentAsset.file_path ? (
              <img
                key={currentAsset.id}
                src={`/api/files/${currentAsset.file_path}`}
                alt={currentAsset.title || currentAsset.file_name || "Preview"}
                className="max-h-[80vh] max-w-[85vw] rounded-lg object-contain"
              />
            ) : /* Video preview */
            currentAsset.media_type === "video" && currentAsset.file_path ? (
              <video
                key={currentAsset.id}
                src={`/api/files/${currentAsset.file_path}`}
                controls
                autoPlay
                className="max-h-[80vh] max-w-[85vw] rounded-lg"
              />
            ) : /* Audio preview */
            currentAsset.media_type === "audio" && currentAsset.file_path ? (
              <div className="flex flex-col items-center gap-6 rounded-xl bg-white p-12">
                <Music className="h-16 w-16 text-orange-400" />
                <p className="text-sm font-medium text-gray-800">
                  {currentAsset.title || currentAsset.file_name}
                </p>
                <audio
                  key={currentAsset.id}
                  src={`/api/files/${currentAsset.file_path}`}
                  controls
                  autoPlay
                  className="w-80"
                />
              </div>
            ) : /* PDF preview */
            isDocumentPreviewable(currentAsset.file_mime || undefined) && currentAsset.file_path ? (
              <div className="flex h-[85vh] w-[85vw] max-w-5xl flex-col rounded-lg bg-white overflow-hidden">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-800">
                      {currentAsset.title || currentAsset.file_name}
                    </span>
                  </div>
                  <a
                    href={`/api/files/${currentAsset.file_path}`}
                    download
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
                  >
                    <Download className="h-3.5 w-3.5" /> Unduh
                  </a>
                </div>
                <iframe
                  key={currentAsset.id}
                  src={`/api/files/${currentAsset.file_path}`}
                  className="flex-1 w-full"
                  title={currentAsset.title || currentAsset.file_name || "Document preview"}
                />
              </div>
            ) : /* Office docs & other files - info card */
            (
              <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-12 shadow-lg">
                {getAssetIcon(currentAsset.media_type, currentAsset.file_mime || undefined)}
                <p className="max-w-xs truncate text-sm font-medium text-gray-800">
                  {currentAsset.title || currentAsset.file_name}
                </p>
                {currentAsset.file_size && (
                  <p className="text-xs text-gray-400">{formatFileSize(currentAsset.file_size)}</p>
                )}
                {isOfficeDocument(currentAsset.file_mime || undefined) && (
                  <p className="max-w-xs text-center text-xs text-gray-500">
                    Preview tidak tersedia untuk format ini. Silakan unduh file untuk melihat isinya.
                  </p>
                )}
                {currentAsset.file_path && (
                  <a
                    href={`/api/files/${currentAsset.file_path}`}
                    download
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" /> Unduh File
                  </a>
                )}
              </div>
            )}

            {/* Bottom bar */}
            <div className="mt-3 flex w-full items-center justify-between rounded-lg bg-black/50 px-4 py-2 text-sm text-white/90">
              <span className="max-w-[60%] truncate">
                {currentAsset.title || currentAsset.file_name || "Untitled"}
                {currentAsset.file_size ? ` (${formatFileSize(currentAsset.file_size)})` : ""}
              </span>
              {currentAsset.file_path && (
                <a
                  href={`/api/files/${currentAsset.file_path}`}
                  download
                  className="flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-white hover:bg-white/25"
                >
                  <Download className="h-4 w-4" /> Unduh
                </a>
              )}
            </div>

            {/* Thumbnail strip for previewable items */}
            {previewableAssets.length > 1 && (
              <div className="mt-3 flex max-w-[85vw] gap-2 overflow-x-auto rounded-lg bg-black/50 p-2">
                {previewableAssets.map((asset, i) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      const idx = assets.findIndex((a) => a.id === asset.id);
                      setLightboxIndex(idx);
                    }}
                    className={`flex-shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                      currentPreviewIdx === i
                        ? "border-white opacity-100"
                        : "border-transparent opacity-50 hover:opacity-80"
                    }`}
                  >
                    {asset.media_type === "image" && asset.file_path ? (
                      <div
                        className="h-12 w-12 bg-cover bg-center"
                        style={{ backgroundImage: `url(/api/files/${asset.file_path})` }}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center bg-gray-700">
                        {asset.media_type === "video" && <Video className="h-5 w-5 text-purple-300" />}
                        {asset.media_type === "audio" && <Music className="h-5 w-5 text-orange-300" />}
                        {asset.media_type === "document" && <FileText className="h-5 w-5 text-red-300" />}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
