import { LoaderCircleIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card.tsx';

export function LoadingComponent() {
  return (
    <div className="flex grow size-full">
      <Card className="m-auto text-center w-full max-w-[450px] border-none">
        <CardContent className="flex h-32 w-full">
          <LoaderCircleIcon className="m-auto h-12 w-12 animate-spin" />
        </CardContent>
      </Card>
    </div>
  );
}
