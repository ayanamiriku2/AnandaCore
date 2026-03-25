"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { FolderOpen } from "lucide-react";

interface DocumentCategory {
  id: string;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
}

export default function DocumentCategoriesPage() {
  const { data, isLoading } = useQuery<DocumentCategory[]>({
    queryKey: ["document-categories"],
    queryFn: () => api.get("/documents/categories").then((r) => r.data),
  });

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kategori Dokumen</h1>
        <p className="text-[var(--muted-foreground)]">
          Daftar kategori untuk pengarsipan dokumen
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.length ? (
          data.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{category.name}</p>
                  {category.code && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Kode: {category.code}
                    </p>
                  )}
                  {category.description && (
                    <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                      {category.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-[var(--muted-foreground)]">
            Belum ada kategori dokumen
          </div>
        )}
      </div>
    </div>
  );
}
