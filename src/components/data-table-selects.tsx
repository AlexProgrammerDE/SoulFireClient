import { CellContext, HeaderContext } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { useTranslation } from 'react-i18next';

export function SelectAllHeader<T>({ table }: HeaderContext<T, unknown>) {
  const { t } = useTranslation('common');
  return (
    <div className="flex">
      <Checkbox
        className="my-auto"
        defaultChecked={
          table.getIsAllRowsSelected() ||
          (table.getIsSomeRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label={t('dataTable.selectAll')}
      />
    </div>
  );
}

export function SelectRowHeader<T>({ row }: CellContext<T, unknown>) {
  const { t } = useTranslation('common');
  return (
    <div className="flex">
      <Checkbox
        className="my-auto"
        disabled={!row.getCanSelect()}
        defaultChecked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={t('dataTable.selectRow')}
      />
    </div>
  );
}
