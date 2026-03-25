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
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoading } from "@/components/ui/loading";
import { formatDate, statusColor } from "@/lib/utils";
import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  Building2,
  UserPlus,
  FileSignature,
  MessageSquare,
  Globe,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import type {
  Partner,
  PartnerContact,
  PartnershipAgreement,
  PartnerInteraction,
} from "@/types";

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddAgreement, setShowAddAgreement] = useState(false);
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [contactForm, setContactForm] = useState({
    name: "", position: "", email: "", phone: "", notes: "",
  });
  const [agreementForm, setAgreementForm] = useState({
    title: "", agreement_number: "", description: "", start_date: "", end_date: "",
  });
  const [interactionForm, setInteractionForm] = useState({
    interaction_type: "meeting", subject: "", description: "", interaction_date: "",
  });

  const { data: partner, isLoading } = useQuery<Partner>({
    queryKey: ["partner", id],
    queryFn: () => api.get(`/partners/${id}`).then((r) => r.data.partner),
  });

  const { data: contacts } = useQuery<PartnerContact[]>({
    queryKey: ["partner-contacts", id],
    queryFn: () => api.get(`/partners/${id}/contacts`).then((r) => r.data),
    enabled: activeTab === "contacts",
  });

  const { data: agreements } = useQuery<PartnershipAgreement[]>({
    queryKey: ["partner-agreements", id],
    queryFn: () => api.get(`/partners/${id}/agreements`).then((r) => r.data),
    enabled: activeTab === "agreements",
  });

  const { data: interactions } = useQuery<PartnerInteraction[]>({
    queryKey: ["partner-interactions", id],
    queryFn: () => api.get(`/partners/${id}/interactions`).then((r) => r.data),
    enabled: activeTab === "interactions",
  });

  const addContactMutation = useMutation({
    mutationFn: (data: typeof contactForm) => api.post(`/partners/${id}/contacts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-contacts", id] });
      setShowAddContact(false);
      setContactForm({ name: "", position: "", email: "", phone: "", notes: "" });
      toast.success("Kontak berhasil ditambahkan");
    },
    onError: () => toast.error("Gagal menambahkan kontak"),
  });

  const addAgreementMutation = useMutation({
    mutationFn: (data: typeof agreementForm) => api.post(`/partners/${id}/agreements`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-agreements", id] });
      setShowAddAgreement(false);
      setAgreementForm({ title: "", agreement_number: "", description: "", start_date: "", end_date: "" });
      toast.success("Perjanjian berhasil ditambahkan");
    },
    onError: () => toast.error("Gagal menambahkan perjanjian"),
  });

  const addInteractionMutation = useMutation({
    mutationFn: (data: typeof interactionForm) =>
      api.post(`/partners/${id}/interactions`, {
        ...data,
        interaction_date: data.interaction_date || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-interactions", id] });
      setShowAddInteraction(false);
      setInteractionForm({ interaction_type: "meeting", subject: "", description: "", interaction_date: "" });
      toast.success("Interaksi berhasil dicatat");
    },
    onError: () => toast.error("Gagal mencatat interaksi"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/partners/${id}`),
    onSuccess: () => {
      toast.success("Mitra berhasil dihapus");
      router.push("/partners");
    },
    onError: () => toast.error("Gagal menghapus mitra"),
  });

  const restoreMutation = useMutation({
    mutationFn: () => api.post(`/partners/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", id] });
      toast.success("Mitra berhasil dipulihkan");
    },
    onError: () => toast.error("Gagal memulihkan mitra"),
  });

  if (isLoading) return <PageLoading />;
  if (!partner) return <div className="p-6">Mitra tidak ditemukan</div>;

  const isDeleted = !!partner.deleted_at;

  const tabs = [
    { id: "overview", label: "Ringkasan" },
    { id: "contacts", label: "Kontak" },
    { id: "agreements", label: "Perjanjian" },
    { id: "interactions", label: "Interaksi" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push("/partners")}
            className="mt-1 rounded-md p-1.5 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{partner.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  {partner.partner_type && (
                    <Badge variant="info">{partner.partner_type}</Badge>
                  )}
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(partner.pipeline_status)}`}
                  >
                    {partner.pipeline_status}
                  </span>
                  {isDeleted && <Badge variant="danger">Dihapus</Badge>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDeleted ? (
            <Button onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending}>
              <RotateCcw className="mr-2 h-4 w-4" /> Pulihkan
            </Button>
          ) : (
            <button
              onClick={() => setShowDelete(true)}
              className="rounded-md p-2 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {partner.description && (
              <div className="rounded-lg border p-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Deskripsi
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{partner.description}</p>
              </div>
            )}
            <div className="rounded-lg border p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Informasi Kontak
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {partner.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" /> {partner.email}
                  </div>
                )}
                {partner.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" /> {partner.phone}
                  </div>
                )}
                {partner.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-gray-400" /> {partner.website}
                  </div>
                )}
                {(partner.address || partner.city) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />{" "}
                    {[partner.address, partner.city, partner.province].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Detail</h3>
              <InfoRow label="Industri" value={partner.industry || "-"} />
              <InfoRow label="Pipeline" value={partner.pipeline_status} />
              <InfoRow label="Hubungan" value={partner.relationship_status || "-"} />
              <InfoRow label="Dibuat" value={formatDate(partner.created_at)} />
            </div>
          </div>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddContact(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Tambah Kontak
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contacts && contacts.length > 0 ? (
              contacts.map((c) => (
                <div key={c.id} className="rounded-lg border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.position || "-"}</p>
                    </div>
                    {c.is_primary && <Badge variant="info">Utama</Badge>}
                  </div>
                  {c.email && <p className="text-xs text-gray-600 mb-1">{c.email}</p>}
                  {c.phone && <p className="text-xs text-gray-600">{c.phone}</p>}
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-sm text-gray-500">
                Belum ada kontak
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agreements Tab */}
      {activeTab === "agreements" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddAgreement(true)}>
              <FileSignature className="mr-2 h-4 w-4" /> Tambah Perjanjian
            </Button>
          </div>
          <div className="rounded-lg border">
            {agreements && agreements.length > 0 ? (
              <ul className="divide-y">
                {agreements.map((a) => (
                  <li key={a.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{a.title}</p>
                        {a.agreement_number && (
                          <p className="text-xs text-gray-500 font-mono">{a.agreement_number}</p>
                        )}
                      </div>
                      <Badge variant={a.status === "aktif" ? "success" : "default"}>
                        {a.status || "draft"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-gray-500">
                      {a.start_date && <span>Mulai: {formatDate(a.start_date)}</span>}
                      {a.end_date && <span>Berakhir: {formatDate(a.end_date)}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">
                Belum ada perjanjian
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactions Tab */}
      {activeTab === "interactions" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddInteraction(true)}>
              <MessageSquare className="mr-2 h-4 w-4" /> Catat Interaksi
            </Button>
          </div>
          <div className="rounded-lg border">
            {interactions && interactions.length > 0 ? (
              <ul className="divide-y">
                {interactions.map((i) => (
                  <li key={i.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="info">{i.interaction_type || "Lainnya"}</Badge>
                        <span className="text-sm font-medium">{i.subject || "-"}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {i.interaction_date ? formatDate(i.interaction_date) : formatDate(i.created_at)}
                      </span>
                    </div>
                    {i.description && (
                      <p className="mt-2 text-sm text-gray-600">{i.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">
                Belum ada riwayat interaksi
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      <Modal open={showAddContact} onClose={() => setShowAddContact(false)} title="Tambah Kontak">
        <form onSubmit={(e) => { e.preventDefault(); addContactMutation.mutate(contactForm); }} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nama</label>
            <Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Jabatan</label>
              <Input value={contactForm.position} onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Telepon</label>
            <Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowAddContact(false)}>Batal</Button>
            <Button type="submit" disabled={addContactMutation.isPending}>
              {addContactMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Agreement Modal */}
      <Modal open={showAddAgreement} onClose={() => setShowAddAgreement(false)} title="Tambah Perjanjian" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); addAgreementMutation.mutate(agreementForm); }} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Judul</label>
            <Input value={agreementForm.title} onChange={(e) => setAgreementForm({ ...agreementForm, title: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nomor Perjanjian</label>
            <Input value={agreementForm.agreement_number} onChange={(e) => setAgreementForm({ ...agreementForm, agreement_number: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Mulai</label>
              <Input type="date" value={agreementForm.start_date} onChange={(e) => setAgreementForm({ ...agreementForm, start_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Berakhir</label>
              <Input type="date" value={agreementForm.end_date} onChange={(e) => setAgreementForm({ ...agreementForm, end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
            <Textarea value={agreementForm.description} onChange={(e) => setAgreementForm({ ...agreementForm, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowAddAgreement(false)}>Batal</Button>
            <Button type="submit" disabled={addAgreementMutation.isPending}>
              {addAgreementMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Interaction Modal */}
      <Modal open={showAddInteraction} onClose={() => setShowAddInteraction(false)} title="Catat Interaksi">
        <form onSubmit={(e) => { e.preventDefault(); addInteractionMutation.mutate(interactionForm); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tipe</label>
              <Select value={interactionForm.interaction_type} onChange={(e) => setInteractionForm({ ...interactionForm, interaction_type: e.target.value })}>
                <option value="meeting">Rapat</option>
                <option value="call">Telepon</option>
                <option value="email">Email</option>
                <option value="visit">Kunjungan</option>
                <option value="other">Lainnya</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tanggal</label>
              <Input type="date" value={interactionForm.interaction_date} onChange={(e) => setInteractionForm({ ...interactionForm, interaction_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Subjek</label>
            <Input value={interactionForm.subject} onChange={(e) => setInteractionForm({ ...interactionForm, subject: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
            <Textarea value={interactionForm.description} onChange={(e) => setInteractionForm({ ...interactionForm, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowAddInteraction(false)}>Batal</Button>
            <Button type="submit" disabled={addInteractionMutation.isPending}>
              {addInteractionMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Hapus Mitra"
        message={`Mitra "${partner.name}" akan dipindahkan ke sampah.`}
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
