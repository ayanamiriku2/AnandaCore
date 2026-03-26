"use client";

import { useState, useRef, useEffect } from "react";
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
  Loader2,
  Table,
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

interface ReportItem {
  cols: string[];
}

interface ReportResult {
  report_type: string;
  data: {
    total?: number;
    total_overdue?: number;
    by_status?: { status: string; count: number }[];
    items?: ReportItem[];
    columns?: string[];
    message?: string;
  };
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState("dokumen");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reportData && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [reportData]);

  async function generateReport(type?: string) {
    const selectedType = type || reportType;
    setGenerating(true);
    setLoadingType(type || null);
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
    } catch {
      toast.error("Gagal memuat laporan");
    } finally {
      setGenerating(false);
      setLoadingType(null);
    }
  }

  function exportCSV() {
    if (!reportData?.data?.columns || !reportData?.data?.items) return;
    const rows: string[] = [];
    rows.push(reportData.data.columns.join(","));
    for (const item of reportData.data.items) {
      rows.push(item.cols.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(","));
    }
    const csv = "\uFEFF" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${reportData.report_type}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File CSV berhasil diunduh");
  }

  const currentReportLabel = reportTypes.find((r) => r.value === reportData?.report_type)?.label || reportData?.report_type;
  const currentReportMeta = reportTypes.find((r) => r.value === reportData?.report_type);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Laporan</h1>
        <p className="text-[var(--muted-foreground)]">
          Lihat ringkasan dan daftar data yayasan
        </p>
      </div>

      {/* Report Cards - Quick View */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isLoading = loadingType === report.value;
          const isActive = reportData?.report_type === report.value;
          return (
            <Card
              key={report.value}
              className={`cursor-pointer transition-all hover:shadow-md ${isActive ? "ring-2 ring-blue-500 shadow-md" : ""}`}
              onClick={() => !generating && generateReport(report.value)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${report.color}`}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{report.label}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {isActive && reportData?.data?.total !== undefined
                      ? `${reportData.data.total} data`
                      : isActive && reportData?.data?.total_overdue !== undefined
                      ? `${reportData.data.total_overdue} overdue`
                      : "Klik untuk melihat"}
                  </p>
                </div>
                {isActive ? (
                  <Table className="h-5 w-5 text-blue-500" />
                ) : (
                  <BarChart3 className="h-5 w-5 text-gray-300" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter by Date */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
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
                {generating && !loadingType ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                {generating && !loadingType ? "Memuat..." : "Lihat Laporan"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <div ref={resultRef} className="space-y-4">
          {/* Header with title and export */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {currentReportMeta && (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${currentReportMeta.color}`}>
                      <currentReportMeta.icon className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <CardTitle>{currentReportLabel}</CardTitle>
                    {(startDate || endDate) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Periode: {startDate || "Awal"} s/d {endDate || "Sekarang"}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={exportCSV} disabled={!reportData.data.items?.length}>
                  <Download className="mr-2 h-4 w-4" /> Unduh CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary stats */}
              <div className="flex flex-wrap gap-4 mb-6">
                {reportData.data.total !== undefined && (
                  <div className="rounded-lg border bg-blue-50 px-6 py-4 min-w-[140px]">
                    <p className="text-sm text-gray-500">Total Data</p>
                    <p className="text-3xl font-bold text-blue-700">{reportData.data.total}</p>
                  </div>
                )}
                {reportData.data.total_overdue !== undefined && (
                  <div className="rounded-lg border bg-red-50 px-6 py-4 min-w-[140px]">
                    <p className="text-sm text-gray-500">Total Overdue</p>
                    <p className="text-3xl font-bold text-red-700">{reportData.data.total_overdue}</p>
                  </div>
                )}
                {reportData.data.by_status && reportData.data.by_status.length > 0 &&
                  reportData.data.by_status.map((item, i) => (
                    <div key={i} className="rounded-lg border bg-gray-50 px-4 py-3 min-w-[100px]">
                      <p className="text-xs text-gray-400 truncate max-w-[120px]">{item.status || "N/A"}</p>
                      <p className="text-xl font-semibold text-gray-700">{item.count}</p>
                    </div>
                  ))
                }
              </div>

              {reportData.data.message && (
                <p className="text-sm text-gray-500">{reportData.data.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Data Table */}
          {reportData.data.items && reportData.data.items.length > 0 && reportData.data.columns && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Daftar Data ({reportData.data.items.length}{(reportData.data.total || reportData.data.total_overdue || 0) > 50 ? ` dari ${reportData.data.total || reportData.data.total_overdue}` : ""})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-600 w-10">#</th>
                        {reportData.data.columns.map((col, i) => (
                          <th key={i} className="px-4 py-3 text-left font-medium text-gray-600">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.items.map((item, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                          {item.cols.map((val, j) => (
                            <td key={j} className="px-4 py-3">
                              {reportData.data.columns && reportData.data.columns[j]?.toLowerCase().includes("status") ? (
                                <Badge variant="default">{val || "-"}</Badge>
                              ) : reportData.data.columns && reportData.data.columns[j]?.toLowerCase().includes("prioritas") ? (
                                <Badge variant={val === "tinggi" || val === "urgent" ? "danger" : val === "rendah" ? "info" : "default"}>
                                  {val || "-"}
                                </Badge>
                              ) : (
                                <span className="line-clamp-2">{val || "-"}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(reportData.data.total || reportData.data.total_overdue || 0) > 50 && (
                  <div className="border-t px-4 py-3 text-center text-xs text-gray-400">
                    Menampilkan 50 data terbaru. Gunakan filter tanggal untuk mempersempit hasil.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {reportData.data.items && reportData.data.items.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                <BarChart3 className="mx-auto mb-3 h-10 w-10" />
                <p>Tidak ada data untuk laporan ini</p>
                {(startDate || endDate) && (
                  <p className="text-xs mt-1">Coba ubah filter tanggal</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
