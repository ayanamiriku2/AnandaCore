"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  Mail,
  FolderKanban,
  CalendarDays,
  Handshake,
  Users,
  ListTodo,
  Package,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { DashboardOverview } from "@/types";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="h-12 w-12 rounded-lg bg-[var(--muted)] animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-16 rounded bg-[var(--muted)] animate-pulse" />
          <div className="h-4 w-24 rounded bg-[var(--muted)] animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-32 rounded bg-[var(--muted)] animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] rounded bg-[var(--muted)] animate-pulse" />
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-36 rounded bg-[var(--muted)] animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-[var(--muted)] animate-pulse" />
                <div className="h-3 w-24 rounded bg-[var(--muted)] animate-pulse" />
              </div>
              <div className="h-3 w-20 rounded bg-[var(--muted)] animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted-foreground)]">
          Selamat datang di AnandaCore - Sistem Manajemen Yayasan Kasih Ananda
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ListSkeleton />
        <ListSkeleton />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardOverview>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard/overview").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading || !data) return <DashboardSkeleton />;

  const stats = [
    {
      label: "Total Dokumen",
      value: data.total_documents,
      icon: FileText,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Total Surat",
      value: data.total_letters,
      icon: Mail,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "Program Aktif",
      value: data.active_programs,
      icon: FolderKanban,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "Total Kegiatan",
      value: data.total_activities,
      icon: CalendarDays,
      color: "text-orange-600 bg-orange-100",
    },
    {
      label: "Mitra Kerja",
      value: data.total_partners,
      icon: Handshake,
      color: "text-cyan-600 bg-cyan-100",
    },
    {
      label: "Penerima Manfaat",
      value: data.total_beneficiaries,
      icon: Users,
      color: "text-pink-600 bg-pink-100",
    },
    {
      label: "Tugas Pending",
      value: data.pending_tasks,
      icon: ListTodo,
      color: "text-yellow-600 bg-yellow-100",
    },
    {
      label: "Total Aset",
      value: data.total_assets,
      icon: Package,
      color: "text-indigo-600 bg-indigo-100",
    },
  ];

  const chartData = [
    { name: "Dokumen", value: data.total_documents },
    { name: "Surat", value: data.total_letters },
    { name: "Program", value: data.total_programs },
    { name: "Kegiatan", value: data.total_activities },
    { name: "Mitra", value: data.total_partners },
    { name: "Aset", value: data.total_assets },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted-foreground)]">
          Selamat datang di AnandaCore - Sistem Manajemen Yayasan Kasih Ananda
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kegiatan Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recent_activities?.length ? (
                data.recent_activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{activity.name}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {activity.program_name}
                      </p>
                    </div>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {activity.start_date
                        ? formatDate(activity.start_date)
                        : "-"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Belum ada kegiatan
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokumen Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recent_documents?.length ? (
                data.recent_documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {doc.document_number}
                      </p>
                    </div>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {formatDate(doc.created_at)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Belum ada dokumen
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
