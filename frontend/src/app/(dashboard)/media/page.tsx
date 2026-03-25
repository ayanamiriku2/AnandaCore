"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { Image, FolderOpen } from "lucide-react";

export default function MediaPage() {
  const { data: albums, isLoading } = useQuery({
    queryKey: ["media-albums"],
    queryFn: () => api.get("/media/albums").then((r) => r.data),
  });

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Media</h1>
        <p className="text-[var(--muted-foreground)]">
          Galeri foto dan media kegiatan yayasan
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {albums?.data?.length ? (
          albums.data.map((album: { id: string; name: string; description?: string; asset_count?: number }) => (
            <Card key={album.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex h-32 items-center justify-center rounded-lg bg-gray-100 mb-4">
                  <FolderOpen className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="font-medium">{album.name}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {album.description || "Tanpa deskripsi"}
                </p>
                <div className="flex items-center gap-1 mt-2 text-sm text-[var(--muted-foreground)]">
                  <Image className="h-3.5 w-3.5" />
                  {album.asset_count || 0} media
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-[var(--muted-foreground)]">
            Belum ada album media
          </div>
        )}
      </div>
    </div>
  );
}
