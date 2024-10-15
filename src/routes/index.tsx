import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useCallback, useContext, useEffect, useState } from 'react';
import {
  FlaskConicalIcon,
  LaptopMinimalIcon,
  LoaderCircleIcon,
  ServerIcon,
} from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import {
  LOCAL_STORAGE_SERVER_ADDRESS_KEY,
  LOCAL_STORAGE_SERVER_TOKEN_KEY,
} from '@/lib/types.ts';
import { SystemInfoContext } from '@/components/providers/system-info-context.tsx';
import { invoke } from '@tauri-apps/api/core';
import { DashboardMenuHeader } from '@/components/dashboard-menu-header.tsx';
import { isDemo } from '@/lib/utils.ts';

export const Route = createFileRoute('/')({
  component: Index,
});

const formSchema = z.object({
  address: z
    .string()
    .min(1, 'Address is required')
    .max(255, 'Address is too long')
    .url('Address must be a valid URL'),
  token: z
    .string()
    .min(1, 'Token is required')
    .max(255, 'Token is too long')
    .regex(
      /e[yw][A-Za-z0-9-_]+\.(?:e[yw][A-Za-z0-9-_]+)?\.[A-Za-z0-9-_]{2,}(?:(?:\.[A-Za-z0-9-_]{2,}){2})?/,
      'Must be a valid JWT token',
    ),
});
type FormSchemaType = z.infer<typeof formSchema>;

type LoginType = 'INTEGRATED' | 'REMOTE';

function Index() {
  const navigate = useNavigate();
  const searchParams: Record<string, string> = Route.useSearch();
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: localStorage.getItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY) ?? '',
      token: localStorage.getItem(LOCAL_STORAGE_SERVER_TOKEN_KEY) ?? '',
    },
  });
  const [loginType, setLoginType] = useState<LoginType | null>(null);
  const [latestLog, setLatestLog] = useState<string>(
    'Preparing to start integrated server...',
  );
  const systemInfo = useContext(SystemInfoContext);

  const targetRedirect = useCallback(async () => {
    await navigate({
      to: searchParams.redirect ?? '/dashboard',
      replace: true,
    });
  }, [navigate, searchParams.redirect]);

  const redirectWithCredentials = useCallback(
    async (address: string, token: string) => {
      localStorage.setItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY, address.trim());
      localStorage.setItem(LOCAL_STORAGE_SERVER_TOKEN_KEY, token.trim());

      await targetRedirect();
    },
    [targetRedirect],
  );

  function onSubmit(values: FormSchemaType) {
    void redirectWithCredentials(values.address, values.token);
  }

  // Hook for loading the integrated server
  useEffect(() => {
    if (loginType === 'INTEGRATED') {
      let listening = true;
      void listen('integrated-server-start-log', (event) => {
        if (!listening) return;
        setLatestLog(event.payload as string);
      });
      void invoke('run_integrated_server').then((payload) => {
        const payloadString = payload as string;
        const split = payloadString.split('\n');

        void redirectWithCredentials(split[0], split[1]);
      });

      return () => {
        listening = false;
      };
    }
  }, [loginType, redirectWithCredentials]);

  return (
    <>
      <DashboardMenuHeader />
      <div className="flex w-full h-full">
        <Card className="m-auto w-full max-w-[450px] border-none">
          <CardHeader>
            <CardTitle>Connect to a SoulFire server</CardTitle>
            {null === loginType ? (
              <CardDescription>
                Integrated server runs a bundled server on the client. Remote
                connects to a remote dedicated SoulFire server.
              </CardDescription>
            ) : null}
            {'INTEGRATED' === loginType ? (
              <CardDescription>{latestLog}</CardDescription>
            ) : null}
            {'REMOTE' === loginType ? (
              <CardDescription>
                Put in the address and token of the server you want to connect
                to.
              </CardDescription>
            ) : null}
          </CardHeader>
          {null === loginType ? (
            <CardContent className="flex flex-col gap-2">
              <div className="flex w-full flex-col gap-1">
                <Button
                  disabled={!systemInfo || isDemo()}
                  variant="outline"
                  className="flex w-full gap-2"
                  onClick={() => setLoginType('INTEGRATED')}
                >
                  <LaptopMinimalIcon className="h-6 w-6" />
                  <p>Use integrated server</p>
                </Button>
                {(!systemInfo && !isDemo()) || systemInfo?.mobile ? (
                  <p className="text-xs text-gray-500">
                    Integrated server is not available on this platform.
                  </p>
                ) : null}
                {isDemo() ? (
                  <p className="text-xs text-gray-500">
                    Integrated server is not available in demo mode.
                  </p>
                ) : null}
              </div>
              <div className="flex w-full flex-col gap-1">
                <Button
                  disabled={isDemo()}
                  variant="outline"
                  className="flex w-full gap-2"
                  onClick={() => setLoginType('REMOTE')}
                >
                  <ServerIcon className="h-6 w-6" />
                  <p>Connect to remote server</p>
                </Button>
                {isDemo() ? (
                  <p className="text-xs text-gray-500">
                    Remote server is not available in demo mode.
                  </p>
                ) : null}
              </div>
              {isDemo() && (
                <Button
                  variant="outline"
                  className="flex w-full gap-2"
                  onClick={() => {
                    void targetRedirect();
                  }}
                >
                  <FlaskConicalIcon className="h-6 w-6" />
                  <p>Use demo server</p>
                </Button>
              )}
              <div className="absolute text-xs text-gray-500 text-center bottom-0 left-0 right-0 mb-2">
                <p className="mb-1">
                  SoulFire Client {APP_VERSION} - {APP_ENVIRONMENT}
                </p>
                {!systemInfo && (
                  <>
                    {APP_ENVIRONMENT === 'production' && (
                      <a
                        className="text-blue-500"
                        href="https://preview.soulfiremc.com"
                      >
                        Looking for preview?
                      </a>
                    )}
                    {APP_ENVIRONMENT === 'preview' && (
                      <a
                        className="text-blue-500"
                        href="https://app.soulfiremc.com"
                      >
                        Looking for production?
                      </a>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          ) : null}
          {'INTEGRATED' === loginType ? (
            <CardContent className="flex h-32 w-full">
              <LoaderCircleIcon className="m-auto h-12 w-12 animate-spin" />
            </CardContent>
          ) : null}
          {'REMOTE' === loginType ? (
            <Form {...form}>
              <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}>
                <CardContent className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="http://localhost:38765"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Address of the server you want to connect to.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Secret token"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Token to authenticate with the server.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      setLoginType(null);
                    }}
                  >
                    Back
                  </Button>
                  <Button type="submit">Connect</Button>
                </CardFooter>
              </form>
            </Form>
          ) : null}
        </Card>
      </div>
    </>
  );
}
