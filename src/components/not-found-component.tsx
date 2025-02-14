import { useTranslation } from 'react-i18next';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import {
  LoaderCircleIcon,
  LogOutIcon,
  RotateCwIcon,
  SearchXIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { isTauri } from '@/lib/utils.tsx';
import { emit } from '@tauri-apps/api/event';
import { logOut } from '@/lib/web-rpc.ts';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';

export function NotFoundComponent() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const router = useRouter();
  const [revalidating, setRevalidating] = useState(false);

  return (
    <div className="flex grow size-full">
      <Card className="m-auto flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold gap-1 flex fle-row">
            <SearchXIcon className="h-8" />
            {t('notFound.page.title')}
          </CardTitle>
          <CardDescription>{t('notFound.page.description')}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-row gap-2">
          <Button
            className="w-fit"
            onClick={() => {
              (async () => {
                if (isTauri()) {
                  await emit('kill-integrated-server', {});
                }
                logOut();
                await navigate({
                  to: '/',
                  replace: true,
                });
              })();
            }}
          >
            <LogOutIcon className="h-4" />
            {t('notFound.page.logOut')}
          </Button>
          <Button
            onClick={() => {
              setRevalidating(true);
              router
                .invalidate()
                .then(() => {
                  setRevalidating(false);
                })
                .catch(() => {
                  setRevalidating(false);
                });
            }}
          >
            {revalidating ? (
              <LoaderCircleIcon className="h-4 animate-spin" />
            ) : (
              <RotateCwIcon className="h-4" />
            )}
            {t('notFound.page.reloadPage')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
