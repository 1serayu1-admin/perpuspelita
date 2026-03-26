import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface BulkSelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  partiallySelected: boolean;
  onToggleAll: (checked: boolean) => void;
  onDelete: () => void;
  selectionLabel?: string;
  deleteLabel?: string;
  className?: string;
}

export function BulkSelectionToolbar({
  selectedCount,
  totalCount,
  allSelected,
  partiallySelected,
  onToggleAll,
  onDelete,
  selectionLabel = 'Pilih semua',
  deleteLabel = 'Hapus terpilih',
  className,
}: BulkSelectionToolbarProps) {
  if (totalCount === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3', className)}>
      <div className="flex items-center gap-3">
        <Checkbox
          checked={allSelected ? true : partiallySelected ? 'indeterminate' : false}
          onCheckedChange={(checked) => onToggleAll(checked === true)}
          aria-label={selectionLabel}
        />
        <div>
          <p className="text-sm font-medium text-foreground">{selectionLabel}</p>
          <p className="text-xs text-muted-foreground">
            {selectedCount > 0 ? `${selectedCount} data dipilih` : `0 dari ${totalCount} data dipilih`}
          </p>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={onDelete} disabled={selectedCount === 0}>
        <Trash2 className="mr-1 h-4 w-4" /> {deleteLabel}
      </Button>
    </div>
  );
}