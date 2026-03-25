"use client";

import { useState, useCallback } from "react";

interface PaginationState {
  page: number;
  per_page: number;
}

export function usePagination(initialPerPage = 25) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    per_page: initialPerPage,
  });

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setPerPage = useCallback((per_page: number) => {
    setPagination({ page: 1, per_page });
  }, []);

  const nextPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
  }, []);

  const prevPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  }, []);

  return { ...pagination, setPage, setPerPage, nextPage, prevPage };
}
