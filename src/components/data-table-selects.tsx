import { CellContext, HeaderContext } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox.tsx';

export function SelectAllHeader<T>({ table }: HeaderContext<T, unknown>) {
  return (
    <div className="flex">
      <Checkbox
        className="my-auto"
        defaultChecked={
          table.getIsAllRowsSelected() ||
          (table.getIsSomeRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label="Select all"
      />
    </div>
  );
}

export function SelectRowHeader<T>({ row }: CellContext<T, unknown>) {
  return (
    <div className="flex">
      <Checkbox
        className="my-auto"
        defaultChecked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    </div>
  );
}
