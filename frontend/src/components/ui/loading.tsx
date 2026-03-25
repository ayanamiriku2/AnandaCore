"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  className?: string;
  text?: string;
}

export function Loading({ className, text = "Memuat..." }: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-12",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      <p className="text-sm text-[var(--muted-foreground)]">{text}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loading />
    </div>
  );
}
