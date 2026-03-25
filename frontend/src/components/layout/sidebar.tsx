"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Mail,
  FolderKanban,
  CalendarDays,
  Handshake,
  Users,
  ListTodo,
  Package,
  Image,
  BarChart3,
  Shield,
  Settings,
  StickyNote,
  Building2,
  ChevronDown,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Dokumen",
    icon: FileText,
    children: [
      { label: "Semua Dokumen", href: "/documents" },
      { label: "Kategori", href: "/documents/categories" },
    ],
  },
  {
    label: "Surat",
    icon: Mail,
    children: [
      { label: "Surat Masuk", href: "/letters?type=incoming" },
      { label: "Surat Keluar", href: "/letters?type=outgoing" },
    ],
  },
  {
    label: "Program",
    icon: FolderKanban,
    children: [
      { label: "Semua Program", href: "/programs" },
      { label: "Kegiatan", href: "/activities" },
    ],
  },
  { label: "Mitra", href: "/partners", icon: Handshake },
  { label: "Penerima Manfaat", href: "/beneficiaries", icon: Users },
  { label: "Tugas", href: "/tasks", icon: ListTodo },
  { label: "Aset", href: "/assets", icon: Package },
  { label: "Media", href: "/media", icon: Image },
  { label: "Memo", href: "/memos", icon: StickyNote },
  { label: "Laporan", href: "/reports", icon: BarChart3 },
  {
    label: "Master Data",
    icon: Building2,
    children: [
      { label: "Departemen", href: "/master/departments" },
      { label: "Peran", href: "/master/roles" },
      { label: "Pengguna", href: "/master/users" },
    ],
  },
  { label: "Audit Log", href: "/audit", icon: Shield },
  { label: "Pengaturan", href: "/settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>([]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function toggle(label: string) {
    setExpanded((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  }

  function isActive(href: string) {
    const basePath = href.split("?")[0];
    return pathname === basePath || pathname.startsWith(basePath + "/");
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-[var(--border)] bg-white transition-transform duration-200 ease-in-out",
          "lg:translate-x-0 lg:z-40",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2">
            <img src="/logo-192.png" alt="Logo" className="h-7 w-7 rounded" />
            <span className="text-lg font-bold text-[var(--primary)]">
              AnandaCore
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isExp = expanded.includes(item.label);

              if (item.children) {
                const childActive = item.children.some((c) =>
                  isActive(c.href)
                );
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => toggle(item.label)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100",
                        childActive
                          ? "text-[var(--primary)]"
                          : "text-gray-700"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExp && "rotate-180"
                        )}
                      />
                    </button>
                    {(isExp || childActive) && (
                      <ul className="ml-7 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={onClose}
                              className={cn(
                                "block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-gray-100",
                                isActive(child.href)
                                  ? "bg-blue-50 text-[var(--primary)] font-medium"
                                  : "text-gray-600"
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <Link
                    href={item.href!}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100",
                      isActive(item.href!)
                        ? "bg-blue-50 text-[var(--primary)]"
                        : "text-gray-700"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t p-4">
          <p className="text-xs text-center text-[var(--muted-foreground)]">
            Yayasan Kasih Ananda
          </p>
        </div>
      </aside>
    </>
  );
}
