import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/query-provider";

export const metadata: Metadata = {
  title: "AnandaCore - Sistem Manajemen Yayasan",
  description: "Sistem manajemen internal Yayasan Kasih Ananda",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/logo-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <QueryProvider>
          {children}
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
