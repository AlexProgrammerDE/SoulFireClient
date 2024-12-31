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
import { ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import {
  FlaskConicalIcon,
  LaptopMinimalIcon,
  LoaderCircleIcon,
  SatelliteDishIcon,
  ServerIcon,
} from 'lucide-react';
import { emit, listen } from '@tauri-apps/api/event';
import {
  LOCAL_STORAGE_FORM_SERVER_ADDRESS_KEY,
  LOCAL_STORAGE_FORM_SERVER_TOKEN_KEY,
  LOCAL_STORAGE_SERVER_ADDRESS_KEY,
  LOCAL_STORAGE_SERVER_TOKEN_KEY,
} from '@/lib/types.ts';
import { SystemInfoContext } from '@/components/providers/system-info-context.tsx';
import { invoke } from '@tauri-apps/api/core';
import { cancellablePromiseDefault, isDemo } from '@/lib/utils.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
import { toast } from 'sonner';

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

function DisabledTooltip(props: {
  getDisabled: () => ReactNode | null;
  provider: (disabled: boolean) => ReactNode;
}) {
  const disabled = props.getDisabled();
  return disabled === null ? (
    props.provider(false)
  ) : (
    <Tooltip>
      <TooltipTrigger>{props.provider(true)}</TooltipTrigger>
      <TooltipContent>{disabled}</TooltipContent>
    </Tooltip>
  );
}

function Index() {
  const navigate = useNavigate();
  const searchParams: Record<string, string> = Route.useSearch();
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address:
        localStorage.getItem(LOCAL_STORAGE_FORM_SERVER_ADDRESS_KEY) ?? '',
      token: localStorage.getItem(LOCAL_STORAGE_FORM_SERVER_TOKEN_KEY) ?? '',
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
    localStorage.setItem(
      LOCAL_STORAGE_FORM_SERVER_ADDRESS_KEY,
      values.address.trim(),
    );
    localStorage.setItem(
      LOCAL_STORAGE_FORM_SERVER_TOKEN_KEY,
      values.token.trim(),
    );

    void redirectWithCredentials(values.address, values.token);
  }

  // Hook for loading the integrated server
  useEffect(() => {
    if (loginType === 'INTEGRATED') {
      const cancel = cancellablePromiseDefault(
        listen('integrated-server-start-log', (event) => {
          setLatestLog(event.payload as string);
        }),
      );
      toast.promise(
        (async () => {
          await emit('kill-integrated-server', {});
          const payload = await invoke('run_integrated_server');
          const payloadString = payload as string;
          const split = payloadString.split('\n');

          await redirectWithCredentials(split[0], split[1]);
        })(),
        {
          loading: 'Starting integrated server...',
          success: 'Integrated server started',
          error: (e) => {
            console.error(e);
            return 'Failed to start integrated server';
          },
        },
      );

      return () => {
        cancel();
      };
    }
  }, [loginType, redirectWithCredentials]);

  return (
    <ScrollArea className="h-dvh w-full pr-4 bg-muted">
      <div className="flex flex-col min-h-dvh w-full">
        <div className="flex flex-col gap-6 m-auto w-full max-w-[450px]">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex flex-row gap-2 text-xl mx-auto">
                <SatelliteDishIcon />
                Connect to a SoulFire server
              </CardTitle>
              {null === loginType ? (
                <CardDescription>
                  Integrated server runs SoulFire on your machine.
                  <br />
                  Dedicated SoulFire servers run on remote machines.
                </CardDescription>
              ) : null}
              {'INTEGRATED' === loginType ? (
                <CardDescription>{latestLog}</CardDescription>
              ) : null}
              {'REMOTE' === loginType ? (
                <CardDescription>
                  Put in the address and token of the SoulFire server you want
                  to connect to.
                </CardDescription>
              ) : null}
            </CardHeader>
            {null === loginType ? (
              <CardContent className="flex flex-col gap-2">
                <div className="flex w-full flex-col gap-1">
                  <DisabledTooltip
                    getDisabled={() => {
                      if (isDemo()) {
                        return (
                          <p>
                            Integrated server is not available in demo mode.
                          </p>
                        );
                      }

                      if (systemInfo === null || systemInfo?.mobile) {
                        return (
                          <p>
                            Integrated server is not available on this platform.
                          </p>
                        );
                      }

                      return null;
                    }}
                    provider={(disabled) => (
                      <Button
                        disabled={disabled}
                        variant="outline"
                        onClick={() => setLoginType('INTEGRATED')}
                      >
                        <LaptopMinimalIcon className="size-5" />
                        Integrated server (local)
                      </Button>
                    )}
                  />
                </div>
                <div className="flex w-full flex-col gap-1">
                  <DisabledTooltip
                    getDisabled={() => {
                      if (isDemo()) {
                        return (
                          <p>
                            Integrated server is not available in demo mode.
                          </p>
                        );
                      }

                      return null;
                    }}
                    provider={(disabled) => (
                      <Button
                        disabled={disabled}
                        variant="outline"
                        onClick={() => setLoginType('REMOTE')}
                      >
                        <ServerIcon className="size-5" />
                        Dedicated server (remote)
                      </Button>
                    )}
                  />
                </div>
                {isDemo() && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      void targetRedirect();
                    }}
                  >
                    <FlaskConicalIcon className="size-5" />
                    Demo server
                  </Button>
                )}
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
                              type="url"
                              inputMode="url"
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
          <div className="text-balance text-xs text-muted-foreground text-center">
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
        </div>
      </div>
    </ScrollArea>
  );
}
