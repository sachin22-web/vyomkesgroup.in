import React, { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface UseListActionsProps<T> {
  resourceName: string; // e.g., "users", "plans", "support/tickets"
  items: T[];
  totalItems: number;
  filters: Record<string, any>; // Current filters for "Delete All (filtered)" and "Download CSV"
  fetchItems: () => Promise<void>; // Function to refresh the list after an action
  idKey?: keyof T; // Key to use for item ID, defaults to '_id' or 'id'
  isUserContext?: boolean; // True if actions are for a user's own records (e.g., /app/withdrawals)
}

export function useListActions<T extends { _id?: string; id?: string }>(
  props: UseListActionsProps<T>,
) {
  const { resourceName, items, totalItems, filters, fetchItems, idKey = "_id", isUserContext = false } = props;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const getItemId = useCallback((item: T): string => {
    return (item[idKey] || item.id || item._id)?.toString() || "";
  }, [idKey]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((_id) => _id !== id) : [...prev, id],
    );
  }, []);

  const toggleAllSelection = useCallback(() => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(getItemId));
    }
  }, [selectedIds, items, getItemId]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.length === 0) {
      toast.info("No items selected for deletion.");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected ${resourceName}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const endpoint = isUserContext ? `/api/app/${resourceName}/batch` : `/api/admin/${resourceName}/batch`;
      await api(endpoint, {
        method: "DELETE",
        body: JSON.stringify({ ids: selectedIds }),
      });
      toast.success(`${selectedIds.length} ${resourceName} deleted.`);
      setSelectedIds([]);
      await fetchItems();
    } catch (e: any) {
      toast.error(e?.message || `Failed to delete selected ${resourceName}.`);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, resourceName, fetchItems, isUserContext]);

  const handleDeleteAllFiltered = useCallback(async () => {
    if (totalItems === 0) {
      toast.info("No items to delete with current filters.");
      return;
    }
    if (!confirm(`Are you sure you want to delete ALL ${totalItems} ${resourceName} matching the current filters? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = isUserContext ? `/api/app/${resourceName}/filtered?${queryParams}` : `/api/admin/${resourceName}/filtered?${queryParams}`;
      await api(endpoint, {
        method: "DELETE",
      });
      toast.success(`All ${totalItems} filtered ${resourceName} deleted.`);
      setSelectedIds([]);
      await fetchItems();
    } catch (e: any) {
      toast.error(e?.message || `Failed to delete filtered ${resourceName}.`);
    } finally {
      setIsDeleting(false);
    }
  }, [totalItems, resourceName, filters, fetchItems, isUserContext]);

  const handleDownloadCsv = useCallback(() => {
    if (totalItems === 0) {
      toast.info("No items to export with current filters.");
      return;
    }
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = isUserContext ? `/api/app/${resourceName}/export?${queryParams}` : `/api/admin/${resourceName}/export?${queryParams}`;
    window.open(endpoint, "_blank");
    toast.info(`Downloading CSV for filtered ${resourceName}.`);
  }, [totalItems, resourceName, filters, isUserContext]);

  const allItemsSelected = useMemo(() => {
    return items.length > 0 && selectedIds.length === items.length;
  }, [items, selectedIds]);

  return {
    selectedIds,
    setSelectedIds,
    toggleSelection,
    toggleAllSelection,
    handleDeleteSelected,
    handleDeleteAllFiltered,
    handleDownloadCsv,
    isDeleting,
    allItemsSelected,
    getItemId,
  };
}