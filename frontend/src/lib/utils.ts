import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function statusColor(status: string | undefined | null): string {
  if (!status) return "bg-gray-100 text-gray-800";
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    aktif: "bg-green-100 text-green-800",
    draft: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    disetujui: "bg-blue-100 text-blue-800",
    rejected: "bg-red-100 text-red-800",
    ditolak: "bg-red-100 text-red-800",
    completed: "bg-green-100 text-green-800",
    selesai: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    dibatalkan: "bg-red-100 text-red-800",
    in_progress: "bg-blue-100 text-blue-800",
    berjalan: "bg-blue-100 text-blue-800",
    archived: "bg-gray-100 text-gray-800",
    diarsipkan: "bg-gray-100 text-gray-800",
    prospect: "bg-yellow-100 text-yellow-800",
    negotiation: "bg-blue-100 text-blue-800",
    agreement: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    planning: "bg-yellow-100 text-yellow-800",
    planned: "bg-yellow-100 text-yellow-800",
    received: "bg-blue-100 text-blue-800",
    sent: "bg-green-100 text-green-800",
  };
  return map[status.toLowerCase()] || "bg-gray-100 text-gray-800";
}
