"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, FileText } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const reportTypes = [
  { value: "dokumen", label: "Laporan Dokumen" },
  { value: "surat_masuk", label: "Laporan Surat Masuk" },
  { value: "surat_keluar", label: "Laporan Surat Keluar" },
  { value: "kegiatan", label: "Laporan Kegiatan" },
  { value: "mitra", label: "Laporan Mitra" },
  { value: "tugas_overdue", label: "Laporan Tugas Overdue" },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState("dokumen");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await api.get("/reports", {
        params: {
          report_type: reportType,
          date_from: startDate || undefined,
          date_to: endDate || undefined,
        },
      });
      setReportData(res.data);
      toast.success("Laporan berhasil dibuat");
    } catch {
      toast.error("Gagal membuat laporan");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Laporan</h1>
        <p className="text-[var(--muted-foreground)]">
          Buat dan unduh laporan yayasan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buat Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Jenis Laporan
              </label>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                {reportTypes.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Tanggal Mulai
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Tanggal Akhir
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={generateReport}
                disabled={generating}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                {generating ? "Membuat..." : "Buat Laporan"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {reportTypes.slice(0, 6).map((report) => (
          <Card key={report.value} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{report.label}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Unduh laporan terbaru
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
