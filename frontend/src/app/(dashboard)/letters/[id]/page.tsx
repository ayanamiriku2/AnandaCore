"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoading } from "@/components/ui/loading";
import { formatDate, formatDateTime, statusColor } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  Paperclip,
  Trash2,
  RotateCcw,
  Mail,
  MailOpen,
  Clock,
  User,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import type { Letter, LetterAttachment, LetterDisposition } from "@/types";

export default function LetterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("detail");
  const [showUpload, setShowUpload] = useState(false);
  const [showDisposition, setShowDisposition] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [attachmentTitle, setAttachmentTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dispForm, setDispForm] = useState({
    to_user_id: "",
    instruction: "",
    priority: "normal",
  });

  const { data: letter, isLoading } = useQuery<Letter>({
    queryKey: ["letter", id],
    queryFn: () => api.get(`/letters/${id}`).then((r) => r.data),
  });

  const { data: attachments } = useQuery<LetterAttachment[]>({
    queryKey: ["letter-attachments", id],
    queryFn: () => api.get(`/letters/${id}/attachments`).then((r) => r.data),
    enabled: activeTab === "attachments",
  });

  const { data: dispositions } = useQuery<LetterDisposition[]>({
    queryKey: ["letter-dispositions", id],
    queryFn: () => api.get(`/letters/${id}/dispositions`).then((r) => r.data),
    enabled: activeTab === "dispositions",
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error("No file");
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (attachmentTitle) formData.append("title", attachmentTitle);
      return api.post(`/letters/${id}/attachments`, formData, {
        onUploadProgress: (evt) => {
          setUploadProgress(Math.round(evt.total ? (evt.loaded / evt.total) * 100 : 0));
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter-attachments", id] });
      setShowUpload(false);
      setUploadFile(null);
      setAttachmentTitle("");
      setUploadProgress(0);
      toast.success("Lampiran berhasil diunggah");
    },
    onError: () => {
      setUploadProgress(0);
      toast.error("Gagal mengunggah lampiran");
    },
  });

  const dispositionMutation = useMutation({
    mutationFn: (data: typeof dispForm) =>
      api.post(`/letters/${id}/dispositions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter-dispositions", id] });
      setShowDisposition(false);
      setDispForm({ to_user_id: "", instruction: "", priority: "normal" });
      toast.success("Disposisi berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat disposisi"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/letters/${id}`),
    onSuccess: () => {
      toast.success("Surat berhasil dihapus");
      router.push("/letters");
    },
    onError: () => toast.error("Gagal menghapus surat"),
  });

  const restoreMutation = useMutation({
    mutationFn: () => api.post(`/letters/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter", id] });
      toast.success("Surat berhasil dipulihkan");
    },
    onError: () => toast.error("Gagal memulihkan surat"),
  });

  if (isLoading) return <PageLoading />;
  if (!letter) return <div className="p-6">Surat tidak ditemukan</div>;

  const isDeleted = !!letter.deleted_at;
  const isIncoming = letter.letter_type === "masuk";

  const tabs = [
    { id: "detail", label: "Detail" },
    { id: "attachments", label: "Lampiran", count: letter.attachment_count || 0 },
    { id: "dispositions", label: "Disposisi" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push("/letters")}
            className="mt-1 rounded-md p-1.5 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold">{letter.subject}</h1>
              {isDeleted && <Badge variant="danger">Dihapus</Badge>}
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <Badge variant={isIncoming ? "info" : "success"}>
                {isIncoming ? "Surat Masuk" : "Surat Keluar"}
              </Badge>
              {letter.letter_number && (
                <span className="font-mono">{letter.letter_number}</span>
              )}
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(letter.status)}`}
              >
                {letter.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDeleted ? (
            <Button onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending}>
              <RotateCcw className="mr-2 h-4 w-4" /> Pulihkan
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowUpload(true)}>
                <Paperclip className="mr-2 h-4 w-4" /> Lampiran
              </Button>
              <Button onClick={() => setShowDisposition(true)}>
                <Send className="mr-2 h-4 w-4" /> Disposisi
              </Button>
              <button
                onClick={() => setShowDelete(true)}
                className="rounded-md p-2 text-red-500 hover:bg-red-50"
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
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField
                  icon={<User className="h-4 w-4" />}
                  label="Pengirim"
                  value={letter.sender || "-"}
                />
                <InfoField
                  icon={<User className="h-4 w-4" />}
                  label="Penerima"
                  value={letter.recipient || "-"}
                />
                <InfoField
                  icon={<Clock className="h-4 w-4" />}
                  label="Tanggal Surat"
                  value={letter.letter_date ? formatDate(letter.letter_date) : "-"}
                />
                <InfoField
                  icon={isIncoming ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  label={isIncoming ? "Tanggal Diterima" : "Tanggal Dikirim"}
                  value={
                    (isIncoming ? letter.received_date : letter.sent_date)
                      ? formatDate((isIncoming ? letter.received_date : letter.sent_date)!)
                      : "-"
                  }
                />
              </div>
            </div>

            {letter.follow_up_notes && (
              <div className="rounded-lg border p-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Catatan Tindak Lanjut
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {letter.follow_up_notes}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Informasi
              </h3>
              <InfoRow label="Status" value={letter.status} />
              <InfoRow label="Tindak Lanjut" value={letter.follow_up_status || "-"} />
              {letter.follow_up_deadline && (
                <InfoRow
                  label="Batas Waktu"
                  value={formatDate(letter.follow_up_deadline)}
                />
              )}
              <InfoRow label="No. Agenda" value={letter.agenda_number || "-"} />
              <InfoRow
                label="Dibuat"
                value={formatDate(letter.created_at)}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "attachments" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowUpload(true)}>
              <Paperclip className="mr-2 h-4 w-4" /> Upload Lampiran
            </Button>
          </div>
          <div className="rounded-lg border">
            {attachments && attachments.length > 0 ? (
              <ul className="divide-y">
                {attachments.map((att) => (
                  <li key={att.id} className="flex items-center gap-4 p-4">
                    <Paperclip className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {att.title || att.file_name || "Lampiran"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {att.file_mime || ""}{" "}
                        {att.file_size
                          ? `· ${(att.file_size / 1024).toFixed(0)} KB`
                          : ""}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `/api/letters/attachments/${att.id}/download`,
                          "_blank"
                        )
                      }
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">
                Belum ada lampiran
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "dispositions" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowDisposition(true)}>
              <Send className="mr-2 h-4 w-4" /> Buat Disposisi
            </Button>
          </div>
          <div className="rounded-lg border">
            {dispositions && dispositions.length > 0 ? (
              <ul className="divide-y">
                {dispositions.map((d) => (
                  <li key={d.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            d.status === "completed"
                              ? "success"
                              : d.status === "read"
                              ? "info"
                              : "default"
                          }
                        >
                          {d.status || "pending"}
                        </Badge>
                        <Badge
                          variant={
                            d.priority === "urgent"
                              ? "danger"
                              : d.priority === "high"
                              ? "warning"
                              : "default"
                          }
                        >
                          {d.priority || "normal"}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(d.created_at)}
                      </span>
                    </div>
                    {d.instruction && (
                      <p className="mt-2 text-sm text-gray-700">
                        {d.instruction}
                      </p>
                    )}
                    {d.notes && (
                      <p className="mt-1 text-sm text-gray-500 italic">
                        {d.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">
                Belum ada disposisi
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Attachment Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Upload Lampiran</h2>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">
                Judul Lampiran (opsional)
              </label>
              <Input
                value={attachmentTitle}
                onChange={(e) => setAttachmentTitle(e.target.value)}
                placeholder="Mis: Surat Balasan"
                disabled={uploadMutation.isPending}
              />
            </div>
            <FileUpload
              onFilesSelected={(files) => setUploadFile(files[0] || null)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
              disabled={uploadMutation.isPending}
            />
            {uploadMutation.isPending && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mengunggah...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => { setShowUpload(false); setUploadFile(null); setAttachmentTitle(""); }}
                disabled={uploadMutation.isPending}
              >
                Batal
              </Button>
              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={!uploadFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? `Mengunggah ${uploadProgress}%` : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Disposition Modal */}
      <Modal
        open={showDisposition}
        onClose={() => setShowDisposition(false)}
        title="Buat Disposisi"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            dispositionMutation.mutate(dispForm);
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              ID Penerima Disposisi
            </label>
            <Input
              value={dispForm.to_user_id}
              onChange={(e) => setDispForm({ ...dispForm, to_user_id: e.target.value })}
              required
              placeholder="UUID pengguna tujuan"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Instruksi
            </label>
            <Textarea
              value={dispForm.instruction}
              onChange={(e) => setDispForm({ ...dispForm, instruction: e.target.value })}
              placeholder="Instruksi untuk penerima"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Prioritas
            </label>
            <Select
              value={dispForm.priority}
              onChange={(e) => setDispForm({ ...dispForm, priority: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="high">Tinggi</option>
              <option value="urgent">Mendesak</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowDisposition(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={dispositionMutation.isPending}>
              {dispositionMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Hapus Surat"
        message="Surat akan dipindahkan ke sampah dan dapat dipulihkan nanti."
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        {icon} {label}
      </div>
      <p className="text-sm font-medium">{value}</p>
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
