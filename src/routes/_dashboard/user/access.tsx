import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useContext, useState } from 'react';
import UserPageLayout from '@/components/nav/user-page-layout.tsx';
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
  FoldersIcon,
  GlobeIcon,
  PlusIcon,
} from 'lucide-react';
import { ExternalLink } from '@/components/external-link.tsx';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { Input } from '@/components/ui/input.tsx';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { ClientServiceClient } from '@/generated/soulfire/client.client.ts';
import { toast } from 'sonner';

export const Route = createFileRoute('/_dashboard/user/access')({
  component: AccessPage,
});

function AccessPage() {
  const { t } = useTranslation('common');
  const clientInfo = useContext(ClientInfoContext);
  const transport = useContext(TransportContext);
  const [webDavToken, setWebDavToken] = useState('');
  const [apiToken, setApiToken] = useState('');

  return (
    <UserPageLayout showUserCrumb={true} pageName={t('pageName.access')}>
      <div className="flex flex-col gap-4">
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <FoldersIcon />
              <span>WebDAV Access</span>
            </CardTitle>
            <CardDescription>
              SoulFire allows you to access instance, script and other files
              using the WebDAV protocol.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <label className="block text-sm font-medium">
              Public WebDAV Address
            </label>
            <Input
              className="select-all"
              value={clientInfo.serverInfo?.publicWebdavAddress}
              readOnly
            />
            <label className="block text-sm font-medium">
              Personal WebDAV Token
            </label>
            <Input
              className="select-all"
              disabled={webDavToken === ''}
              value={webDavToken}
              placeholder="Click 'Generate Token' below"
              readOnly
            />
            <p className="text-muted-foreground text-sm">
              Your personal WebDAV Key is very important. Do not share it with
              anyone. It is used to authenticate you when accessing your files.
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
                  }),
                  {
                    loading: 'Generating token...',
                    success: 'Token generated successfully',
                    error: (error) => {
                      console.error(error);
                      return 'Failed to generate token';
                    },
                  },
                );
              }}
            >
              <PlusIcon />
              <span>Generate Token</span>
            </Button>
            <Button variant="secondary" asChild>
              <ExternalLink href="https://soulfiremc.com/docs">
                <BookOpenTextIcon />
                <span>Documentation</span>
              </ExternalLink>
            </Button>
          </CardFooter>
        </Card>
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <GlobeIcon />
              <span>API Access</span>
            </CardTitle>
            <CardDescription>
              SoulFire's gRPC HTTP API allows you to interact with your
              instances programmatically using web requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <label className="block text-sm font-medium">
              Public API Address
            </label>
            <Input
              className="select-all"
              value={clientInfo.serverInfo?.publicApiAddress}
              readOnly
            />
            <label className="block text-sm font-medium">
              Personal API Token
            </label>
            <Input
              className="select-all"
              disabled={apiToken === ''}
              value={apiToken}
              placeholder="Click 'Generate Token' below"
              readOnly
            />
            <p className="text-muted-foreground text-sm">
              Your personal API Key is very important. Do not share it with
              anyone. It is used to authenticate you when accessing the API.
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
                  }),
                  {
                    loading: 'Generating token...',
                    success: 'Token generated successfully',
                    error: (error) => {
                      console.error(error);
                      return 'Failed to generate token';
                    },
                  },
                );
              }}
            >
              <PlusIcon />
              <span>Generate Token</span>
            </Button>
            <Button variant="secondary" asChild>
              <ExternalLink href={clientInfo.serverInfo?.publicDocsAddress}>
                <BookOpenTextIcon />
                <span>Documentation</span>
              </ExternalLink>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </UserPageLayout>
  );
}
