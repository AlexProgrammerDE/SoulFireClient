import { LoaderCircleIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card.tsx';

export function LoadingComponent() {
  return (
    <div className="flex size-full grow">
      <Card className="m-auto w-full max-w-[450px] border-none text-center">
        <CardContent className="flex h-32 w-full">
          <LoaderCircleIcon className="m-auto h-12 w-12 animate-spin" />
        </CardContent>
      </Card>
    </div>
  );
}
