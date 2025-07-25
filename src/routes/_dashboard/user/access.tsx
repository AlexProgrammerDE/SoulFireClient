import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { use, useState } from 'react';
import UserPageLayout from '@/components/nav/user/user-page-layout.tsx';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  BookOpenTextIcon,
  CopyIcon,
  FoldersIcon,
  GlobeIcon,
  PlusIcon,
} from 'lucide-react';
import { ExternalLink } from '@/components/external-link.tsx';
import { Input } from '@/components/ui/input.tsx';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { ClientServiceClient } from '@/generated/soulfire/client.client.ts';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/utils.tsx';
import { useSuspenseQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/_dashboard/user/access')({
  component: AccessPage,
});

function AccessPage() {
  const { t } = useTranslation('common');

  return (
    <UserPageLayout showUserCrumb={true} pageName={t('pageName.access')}>
      <Content />
    </UserPageLayout>
  );
}

function Content() {
  const { t } = useTranslation('common');
  const { clientDataQueryOptions } = Route.useRouteContext();
  const { data: clientInfo } = useSuspenseQuery(clientDataQueryOptions);
  const transport = use(TransportContext);
  const [webDavToken, setWebDavToken] = useState('');
  const [apiToken, setApiToken] = useState('');

  return (
    <div className="flex flex-col gap-4">
      <Card className="container">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <FoldersIcon />
            <span>{t('access.webdav.title')}</span>
          </CardTitle>
          <CardDescription>{t('access.webdav.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <label className="block text-sm font-medium">
            {t('access.webdav.publicAddress')}
          </label>
          <div className="flex items-center gap-2">
            <Input
              className="select-all"
              value={clientInfo.serverInfo?.publicWebdavAddress}
              readOnly
            />
            <Button
              variant="secondary"
              onClick={() => {
                copyToClipboard(
                  clientInfo.serverInfo?.publicWebdavAddress || '',
                );
                toast.success(t('access.address.copied'));
              }}
            >
              <CopyIcon />
              <span>{t('access.address.copy')}</span>
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('access.webdav.addressDescription')}
          </p>
          <label className="block text-sm font-medium">
            {t('access.webdav.personalToken')}
          </label>
          <div className="flex items-center gap-2">
            <Input
              className="select-all"
              disabled={webDavToken === ''}
              value={webDavToken}
              placeholder={t('access.token.placeholder')}
              readOnly
            />
            <Button
              variant="secondary"
              onClick={() => {
                copyToClipboard(webDavToken);
                toast.success(t('access.token.copied'));
              }}
              disabled={webDavToken === ''}
            >
              <CopyIcon />
              <span>{t('access.token.copy')}</span>
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('access.webdav.securityWarning')}
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            onClick={() => {
              if (transport === null) {
                return;
              }

              const clientService = new ClientServiceClient(transport);
              toast.promise(
                clientService.generateWebDAVToken({}).then((response) => {
                  setWebDavToken(response.response.token);
                  copyToClipboard(response.response.token);
                  toast.success(t('access.token.copied'));
                }),
                {
                  loading: t('access.token.generating'),
                  success: t('access.token.success'),
                  error: (error) => {
                    console.error(error);
                    return t('access.token.error');
                  },
                },
              );
            }}
          >
            <PlusIcon />
            <span>{t('access.token.generate')}</span>
          </Button>
          <Button variant="secondary" asChild>
            <ExternalLink href="https://soulfiremc.com/docs/guides/webdav">
              <BookOpenTextIcon />
              <span>{t('access.howToConnect')}</span>
            </ExternalLink>
          </Button>
        </CardFooter>
      </Card>
      <Card className="container">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <GlobeIcon />
            <span>{t('access.api.title')}</span>
          </CardTitle>
          <CardDescription>{t('access.api.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <label className="block text-sm font-medium">
            {t('access.api.publicAddress')}
          </label>
          <div className="flex items-center gap-2">
            <Input
              className="select-all"
              value={clientInfo.serverInfo?.publicApiAddress}
              readOnly
            />
            <Button
              variant="secondary"
              onClick={() => {
                copyToClipboard(clientInfo.serverInfo?.publicApiAddress || '');
                toast.success(t('access.address.copied'));
              }}
            >
              <CopyIcon />
              <span>{t('access.address.copy')}</span>
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('access.api.addressDescription')}
          </p>
          <label className="block text-sm font-medium">
            {t('access.api.personalToken')}
          </label>
          <div className="flex items-center gap-2">
            <Input
              className="select-all"
              disabled={apiToken === ''}
              value={apiToken}
              placeholder={t('access.token.placeholder')}
              readOnly
            />
            <Button
              variant="secondary"
              onClick={() => {
                copyToClipboard(apiToken);
                toast.success(t('access.token.copied'));
              }}
              disabled={apiToken === ''}
            >
              <CopyIcon />
              <span>{t('access.token.copy')}</span>
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('access.api.securityWarning')}
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            onClick={() => {
              if (transport === null) {
                return;
              }

              const clientService = new ClientServiceClient(transport);
              toast.promise(
                clientService.generateAPIToken({}).then((response) => {
                  setApiToken(response.response.token);
                  copyToClipboard(response.response.token);
                  toast.success(t('access.token.copied'));
                }),
                {
                  loading: t('access.token.generating'),
                  success: t('access.token.success'),
                  error: (error) => {
                    console.error(error);
                    return t('access.token.error');
                  },
                },
              );
            }}
          >
            <PlusIcon />
            <span>{t('access.token.generate')}</span>
          </Button>
          <Button variant="secondary" asChild>
            <ExternalLink href={clientInfo.serverInfo!.publicDocsAddress}>
              <BookOpenTextIcon />
              <span>{t('access.documentation')}</span>
            </ExternalLink>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
