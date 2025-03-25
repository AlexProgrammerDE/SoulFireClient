import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { LoaderCircleIcon } from 'lucide-react';

export function ConnectingComponent() {
  const { t } = useTranslation('common');

  return (
    <div className="flex size-full grow">
      <Card className="m-auto w-full max-w-[450px] border-none text-center">
        <CardHeader className="pb-0">
          <CardTitle>{t('pending.connecting')}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-32 w-full">
          <LoaderCircleIcon className="m-auto h-12 w-12 animate-spin" />
        </CardContent>
      </Card>
    </div>
  );
}
