"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Shield, Calendar, Save } from "lucide-react";
import { toast } from "sonner";

interface MeResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    is_active: boolean;
    last_login_at?: string;
    created_at: string;
  };
  roles: string[];
}

export default function ProfilePage() {
  const { fetchProfile } = useAuth();
  const { data, isLoading } = useQuery<MeResponse>({
    queryKey: ["profile-me"],
    queryFn: () => api.get("/auth/me").then((r) => r.data),
  });

  const [form, setForm] = useState({ full_name: "", phone: "" });

  useEffect(() => {
    if (data?.user) {
      setForm({
        full_name: data.user.full_name || "",
        phone: data.user.phone || "",
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (body: typeof form) =>
      api.put(`/users/${data?.user.id}`, body),
    onSuccess: () => {
      fetchProfile();
      toast.success("Profil berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui profil"),
  });

  if (isLoading) return <PageLoading />;
  if (!data) return null;

  const { user, roles } = data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Profil Saya</h1>
        <p className="text-[var(--muted-foreground)]">
          Lihat dan perbarui informasi akun Anda
        </p>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Informasi Akun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-xl font-bold text-white">
              {user.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold">{user.full_name}</p>
              <p className="flex items-center gap-1.5 text-sm text-gray-500">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <Badge variant={user.is_active ? "success" : "default"}>
                {user.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500">Peran</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {roles.map((r) => (
                  <Badge key={r} variant="info">
                    <Shield className="mr-1 h-3 w-3" /> {r}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Terdaftar</p>
              <p className="text-sm flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {formatDate(user.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Login Terakhir</p>
              <p className="text-sm">
                {user.last_login_at ? formatDate(user.last_login_at) : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate(form);
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Nama Lengkap
              </label>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                <Phone className="mr-1 inline h-3.5 w-3.5" /> Telepon
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+62..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                <Mail className="mr-1 inline h-3.5 w-3.5" /> Email
              </label>
              <Input value={user.email} disabled className="bg-gray-50" />
              <p className="mt-1 text-xs text-gray-400">
                Email tidak dapat diubah
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
