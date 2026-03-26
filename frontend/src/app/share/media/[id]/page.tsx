import type { Metadata } from "next";
import PublicAlbumClient from "./album-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function fetchAlbum(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/media/albums/${id}/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchAlbum(id);

  if (!data?.album) {
    return {
      title: "Album tidak ditemukan - AnandaCore",
    };
  }

  const album = data.album;
  const assetCount = data.assets?.length ?? 0;
  const description =
    album.description || `Album dokumentasi dengan ${assetCount} file - Dibagikan dari AnandaCore`;

  // Find first image asset for og:image
  const firstImage = data.assets?.find(
    (a: { media_type: string; file_path?: string }) =>
      a.media_type === "image" && a.file_path
  );
  const ogImage = firstImage
    ? `${API_BASE}/api/files/${firstImage.file_path}`
    : undefined;

  return {
    title: `${album.title} - AnandaCore`,
    description,
    openGraph: {
      title: album.title,
      description,
      type: "website",
      siteName: "AnandaCore",
      ...(ogImage && {
        images: [{ url: ogImage }],
      }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: album.title,
      description,
      ...(ogImage && {
        images: [ogImage],
      }),
    },
  };
}

export default function PublicAlbumPage() {
  return <PublicAlbumClient />;
}
