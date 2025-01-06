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
  InfoIcon,
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
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Logo from 'public/logo.png';

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
      to: searchParams.redirect ?? '/dashboard/user/instances',
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
    <ScrollArea className="h-dvh w-full px-4 bg-muted">
      <div className="flex flex-col min-h-dvh w-full">
        <div className="flex flex-col gap-6 m-auto w-full max-w-[450px]">
          <div className="text-center flex flex-row items-center justify-center gap-2">
            <img
              className="size-8"
              width={32}
              height={32}
              src={Logo}
              alt="SoulFire Logo"
            />
            <p className="font-medium tracking-wide">SoulFire</p>
          </div>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex flex-row gap-2 text-xl mx-auto">
                <SatelliteDishIcon />
                Connect to a SoulFire server
              </CardTitle>
              {null === loginType ? (
                <CardDescription>
                  Select which type of SoulFire server to connect to.
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
                <div className="flex flex-row gap-2">
                  <Button
                    disabled={isDemo() || !systemInfo || systemInfo.mobile}
                    className="w-full"
                    variant="outline"
                    onClick={() => setLoginType('INTEGRATED')}
                  >
                    <LaptopMinimalIcon className="size-5" />
                    Integrated server (local)
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button className="w-fit" variant="outline">
                        <InfoIcon className="size-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      Runs a SoulFire server on your computer. The setup is
                      automatic and requires no configuration. (Requires the
                      desktop app)
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-row gap-2">
                  <Button
                    disabled={isDemo()}
                    className="w-full"
                    variant="outline"
                    onClick={() => setLoginType('REMOTE')}
                  >
                    <ServerIcon className="size-5" />
                    Dedicated server (remote)
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button className="w-fit" variant="outline">
                        <InfoIcon className="size-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      Connects to a remote instance of the SoulFire server. You
                      will need to provide the address and token of the server.
                    </PopoverContent>
                  </Popover>
                </div>
                {isDemo() && (
                  <div className="flex flex-row gap-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        void targetRedirect();
                      }}
                    >
                      <FlaskConicalIcon className="size-5" />
                      Demo server
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button className="w-fit" variant="outline">
                          <InfoIcon className="size-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        Simulates a virtual server with demo data. This server
                        is read-only and you cannot make any changes to it.
                      </PopoverContent>
                    </Popover>
                  </div>
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
