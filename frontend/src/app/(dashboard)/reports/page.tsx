"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  FileText,
  Mail,
  MailOpen,
  CalendarDays,
  Handshake,
  AlertTriangle,
  Download,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const reportTypes = [
  { value: "dokumen", label: "Laporan Dokumen", icon: FileText, color: "bg-blue-100 text-blue-600" },
  { value: "surat_masuk", label: "Laporan Surat Masuk", icon: MailOpen, color: "bg-green-100 text-green-600" },
  { value: "surat_keluar", label: "Laporan Surat Keluar", icon: Mail, color: "bg-teal-100 text-teal-600" },
  { value: "kegiatan", label: "Laporan Kegiatan", icon: CalendarDays, color: "bg-orange-100 text-orange-600" },
  { value: "mitra", label: "Laporan Mitra", icon: Handshake, color: "bg-purple-100 text-purple-600" },
  { value: "tugas_overdue", label: "Laporan Tugas Overdue", icon: AlertTriangle, color: "bg-red-100 text-red-600" },
];

interface ReportResult {
  report_type: string;
  data: {
    total?: number;
    total_overdue?: number;
    by_status?: { status: string; count: number }[];
    message?: string;
  };
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState("dokumen");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportResult | null>(null);

  async function generateReport(type?: string) {
    const selectedType = type || reportType;
    setGenerating(true);
    try {
      const res = await api.get("/reports", {
        params: {
          report_type: selectedType,
          date_from: startDate || undefined,
          date_to: endDate || undefined,
        },
      });
      setReportData(res.data);
      if (type) setReportType(selectedType);
      toast.success("Laporan berhasil dibuat");
    } catch {
      toast.error("Gagal membuat laporan");
    } finally {
      setGenerating(false);
    }
  }

  const currentReportLabel = reportTypes.find((r) => r.value === reportData?.report_type)?.label || reportData?.report_type;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Laporan</h1>
        <p className="text-[var(--muted-foreground)]">
          Buat dan lihat laporan ringkasan yayasan
        </p>
      </div>

      {/* Report Cards - Quick Generate */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.value}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => generateReport(report.value)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${report.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{report.label}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Klik untuk melihat laporan
                  </p>
                </div>
                <BarChart3 className="h-5 w-5 text-gray-300" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Buat Laporan Kustom</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Jenis Laporan</label>
              <Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                {reportTypes.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tanggal Mulai</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tanggal Akhir</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => generateReport()} disabled={generating} className="w-full">
                {generating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                {generating ? "Membuat..." : "Buat Laporan"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hasil: {currentReportLabel}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = formatReportText(reportData, currentReportLabel || "");
                  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `laporan-${reportData.report_type}-${new Date().toISOString().split("T")[0]}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Unduh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary stat */}
              <div className="flex flex-wrap gap-4">
                {reportData.data.total !== undefined && (
                  <div className="rounded-lg border bg-blue-50 px-6 py-4">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-3xl font-bold text-blue-700">{reportData.data.total}</p>
                  </div>
                )}
                {reportData.data.total_overdue !== undefined && (
                  <div className="rounded-lg border bg-red-50 px-6 py-4">
                    <p className="text-sm text-gray-500">Total Overdue</p>
                    <p className="text-3xl font-bold text-red-700">{reportData.data.total_overdue}</p>
                  </div>
                )}
              </div>

              {/* By status breakdown */}
              {reportData.data.by_status && reportData.data.by_status.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-600">Distribusi Status</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-4 py-2.5 text-left font-medium text-gray-600">Status</th>
                          <th className="px-4 py-2.5 text-right font-medium text-gray-600">Jumlah</th>
                          <th className="px-4 py-2.5 text-left font-medium text-gray-600">Persentase</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.data.by_status.map((item, i) => {
                          const total = reportData.data.total || 1;
                          const pct = ((item.count / total) * 100).toFixed(1);
                          return (
                            <tr key={i} className="border-b last:border-0">
                              <td className="px-4 py-2.5">
                                <Badge variant="default">{item.status || "N/A"}</Badge>
                              </td>
                              <td className="px-4 py-2.5 text-right font-medium">{item.count}</td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 flex-1 max-w-[120px] rounded-full bg-gray-200">
                                    <div
                                      className="h-2 rounded-full bg-blue-600"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportData.data.message && (
                <p className="text-sm text-gray-500">{reportData.data.message}</p>
              )}

              {/* Date range info */}
              {(startDate || endDate) && (
                <p className="text-xs text-gray-400">
                  Periode: {startDate || "Awal"} s/d {endDate || "Sekarang"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatReportText(report: ReportResult, label: string): string {
  const lines: string[] = [];
  lines.push(`=== ${label} ===`);
  lines.push(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`);
  lines.push("");
  if (report.data.total !== undefined) {
    lines.push(`Total: ${report.data.total}`);
  }
  if (report.data.total_overdue !== undefined) {
    lines.push(`Total Overdue: ${report.data.total_overdue}`);
  }
  if (report.data.by_status && report.data.by_status.length > 0) {
    lines.push("");
    lines.push("Distribusi Status:");
    for (const item of report.data.by_status) {
      lines.push(`  ${item.status || "N/A"}: ${item.count}`);
    }
  }
  return lines.join("\n");
}
