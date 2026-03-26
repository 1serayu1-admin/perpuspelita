import { useEffect, useMemo, useState } from 'react';

export function useBulkSelection(visibleIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => visibleIds.includes(id)));
  }, [visibleIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedVisibleCount = visibleIds.filter((id) => selectedSet.has(id)).length;
  const allSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const partiallySelected = selectedVisibleCount > 0 && !allSelected;

  const toggleOne = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? visibleIds : []);
  };

  return {
    selectedIds,
    allSelected,
    partiallySelected,
    isSelected: (id: string) => selectedSet.has(id),
    toggleOne,
    toggleAll,
    clear: () => setSelectedIds([]),
  };
}