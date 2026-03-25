"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Setting } from "@/types";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<Setting[]>({
    queryKey: ["settings"],
    queryFn: () => api.get("/settings").then((r) => r.data),
  });

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s) => (map[s.key] = s.value || ""));
      setValues(map);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (items: { key: string; value: string }[]) => {
      await Promise.all(
        items.map((item) =>
          api.put(`/settings/${encodeURIComponent(item.key)}`, { value: item.value })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Pengaturan berhasil disimpan");
    },
    onError: () => toast.error("Gagal menyimpan pengaturan"),
  });

  if (isLoading) return <PageLoading />;

  // Group by value_type prefix or just show flat list
  const groupByPrefix = (settings: Setting[]) => {
    const groups: Record<string, Setting[]> = {};
    for (const s of settings) {
      const prefix = s.key.split(".")[0] || "general";
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(s);
    }
    return groups;
  };

  const groups = groupByPrefix(data || []);

  function handleSave() {
    const items = Object.entries(values).map(([key, value]) => ({
      key,
      value,
    }));
    updateMutation.mutate(items);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-7 w-7 text-[var(--primary)]" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Pengaturan</h1>
            <p className="text-[var(--muted-foreground)]">
              Konfigurasi sistem
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>

      {Object.entries(groups).map(([group, settings]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="capitalize">{group}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.map((setting) => (
                  <div
                    key={setting.key}
                    className="grid grid-cols-3 items-center gap-4"
                  >
                    <div>
                      <p className="font-medium text-sm">{setting.key}</p>
                      {setting.description && (
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {setting.description}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={values[setting.key] || ""}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            [setting.key]: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
