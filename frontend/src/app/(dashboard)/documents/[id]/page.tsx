"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoading } from "@/components/ui/loading";
import { formatDate, formatDateTime, statusColor } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  CheckCircle,
  FileText,
  Clock,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import type { Document, DocumentVersion } from "@/types";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("detail");
  const [showUpload, setShowUpload] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [changeNotes, setChangeNotes] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const { data: doc, isLoading } = useQuery<Document>({
    queryKey: ["document", id],
    queryFn: () => api.get(`/documents/${id}`).then((r) => r.data),
  });

  const { data: versions } = useQuery<DocumentVersion[]>({
    queryKey: ["document-versions", id],
    queryFn: () => api.get(`/documents/${id}/versions`).then((r) => r.data),
    enabled: activeTab === "versions",
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error("No file");
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (changeNotes) formData.append("change_notes", changeNotes);
      return api.post(`/documents/${id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      queryClient.invalidateQueries({ queryKey: ["document-versions", id] });
      setShowUpload(false);
      setUploadFile(null);
      setChangeNotes("");
      toast.success("File berhasil diunggah");
    },
    onError: () => toast.error("Gagal mengunggah file"),
  });

  const verifyMutation = useMutation({
    mutationFn: () => api.post(`/documents/${id}/verify`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      toast.success("Dokumen berhasil diverifikasi");
    },
    onError: () => toast.error("Gagal memverifikasi dokumen"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/documents/${id}`),
    onSuccess: () => {
      toast.success("Dokumen berhasil dihapus");
      router.push("/documents");
    },
    onError: () => toast.error("Gagal menghapus dokumen"),
  });

  const restoreMutation = useMutation({
    mutationFn: () => api.post(`/documents/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      toast.success("Dokumen berhasil dipulihkan");
    },
    onError: () => toast.error("Gagal memulihkan dokumen"),
  });

  if (isLoading) return <PageLoading />;
  if (!doc) return <div className="p-6">Dokumen tidak ditemukan</div>;

  const isDeleted = !!doc.deleted_at;

  const tabs = [
    { id: "detail", label: "Detail" },
    { id: "versions", label: "Riwayat Versi", count: doc.current_version || 0 },
  ];

  function formatFileSize(bytes?: number) {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push("/documents")}
            className="mt-1 rounded-md p-1.5 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold">{doc.title}</h1>
              {isDeleted && (
                <Badge variant="danger">Dihapus</Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              {doc.document_number && (
                <span className="font-mono">{doc.document_number}</span>
              )}
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
                  doc.status
                )}`}
              >
                {doc.status}
              </span>
              {doc.verification_status && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    doc.verification_status === "terverifikasi"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  {doc.verification_status}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDeleted ? (
            <Button onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Pulihkan
            </Button>
          ) : (
            <>
              {doc.file_path && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`/api/documents/${id}/download`, "_blank")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Unduh
                </Button>
              )}
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              {doc.verification_status !== "terverifikasi" && (
                <Button
                  variant="outline"
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verifikasi
                </Button>
              )}
              <button
                onClick={() => setShowDelete(true)}
                className="rounded-md p-2 text-red-500 hover:bg-red-50"
                title="Hapus"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "detail" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Preview Area */}
            <div className="rounded-lg border p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                File Dokumen
              </h3>
              {doc.file_path ? (
                <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                  <FileText className="h-10 w-10 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">{doc.file_name || "Dokumen"}</p>
                    <p className="text-sm text-gray-500">
                      {doc.file_mime || "Unknown"} &middot;{" "}
                      {formatFileSize(doc.file_size)}
                      {doc.current_version && ` · Versi ${doc.current_version}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(`/api/documents/${id}/download`, "_blank")
                    }
                  >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Unduh
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                  <FileText className="mb-2 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">Belum ada file</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowUpload(true)}
                  >
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    Upload File
                  </Button>
                </div>
              )}
            </div>

            {/* Description */}
            {doc.description && (
              <div className="rounded-lg border p-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Deskripsi
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {doc.description}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Informasi
              </h3>
              <InfoRow label="Status" value={doc.status} />
              <InfoRow label="Kerahasiaan" value={doc.confidentiality || "-"} />
              <InfoRow label="Retensi" value={doc.retention_type || "-"} />
              <InfoRow
                label="Tanggal Dibuat"
                value={formatDate(doc.created_at)}
              />
              <InfoRow
                label="Terakhir Diubah"
                value={formatDate(doc.updated_at)}
              />
              {doc.verified_at && (
                <InfoRow
                  label="Diverifikasi"
                  value={formatDateTime(doc.verified_at)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "versions" && (
        <div className="rounded-lg border">
          {versions && versions.length > 0 ? (
            <ul className="divide-y">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center gap-4 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                    v{v.version_number}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {v.file_name || "File"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(v.created_at)}
                      {v.change_notes && (
                        <span className="ml-2">— {v.change_notes}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(`/api/files/${v.file_path}`, "_blank")
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              Belum ada riwayat versi
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Upload File Dokumen</h2>
            <FileUpload
              onFilesSelected={(files) => setUploadFile(files[0] || null)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
            />
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium">
                Catatan Perubahan (opsional)
              </label>
              <input
                type="text"
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="Mis: Revisi setelah review pimpinan"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpload(false);
                  setUploadFile(null);
                  setChangeNotes("");
                }}
              >
                Batal
              </Button>
              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={!uploadFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Mengunggah..." : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Hapus Dokumen"
        message="Dokumen akan dipindahkan ke sampah dan dapat dipulihkan nanti. Apakah Anda yakin?"
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
