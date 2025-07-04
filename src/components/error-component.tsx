import { useTranslation } from 'react-i18next';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  BugIcon,
  LoaderCircleIcon,
  LogOutIcon,
  RotateCwIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { isTauri, runAsync } from '@/lib/utils.tsx';
import { emit } from '@tauri-apps/api/event';
import { logOut } from '@/lib/web-rpc.ts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';

export function ErrorComponent({ error }: { error: Error }) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const router = useRouter();
  const [revalidating, setRevalidating] = useState(false);

  function revalidate() {
    setRevalidating(true);
    void router.invalidate().finally(() => {
      setRevalidating(false);
    });
  }

  useEffect(() => {
    const interval = setInterval(revalidate, 1000 * 5);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex size-full grow">
      <Card className="m-auto flex flex-col">
        <CardHeader>
          <CardTitle className="fle-row flex gap-1 text-2xl font-bold">
            <BugIcon className="h-8" />
            {t('error.page.title')}
          </CardTitle>
          <CardDescription>{t('error.page.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="max-w-2xl truncate text-red-500">{error.message}</p>
        </CardContent>
        <CardFooter className="flex flex-row gap-2">
          <Button
            className="w-fit"
            onClick={() =>
              runAsync(async () => {
                if (isTauri()) {
                  await emit('kill-integrated-server', {});
                }
                logOut();
                await navigate({
                  to: '/',
                  replace: true,
                });
              })
            }
          >
            <LogOutIcon />
            {t('error.page.logOut')}
          </Button>
          <Button onClick={revalidate}>
            {revalidating ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <RotateCwIcon />
            )}
            {t('error.page.reloadPage')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
