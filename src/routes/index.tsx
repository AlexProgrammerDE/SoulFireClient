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
  getEnumKeyByValue,
  LOCAL_STORAGE_FORM_SERVER_ADDRESS_KEY,
  LOCAL_STORAGE_FORM_SERVER_EMAIL_KEY,
  LOCAL_STORAGE_FORM_SERVER_TOKEN_KEY,
  LOCAL_STORAGE_SERVER_ADDRESS_KEY,
  LOCAL_STORAGE_SERVER_TOKEN_KEY,
} from '@/lib/types.ts';
import { SystemInfoContext } from '@/components/providers/system-info-context.tsx';
import { invoke } from '@tauri-apps/api/core';
import {
  cancellablePromiseDefault,
  getLanguageName,
  isDemo,
  languageEmoji,
} from '@/lib/utils.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Logo from 'public/logo.png';
import { Trans, useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { NextAuthFlowResponse_Failure_Reason } from '@/generated/soulfire/login.ts';
import { LoginServiceClient } from '@/generated/soulfire/login.client.ts';
import { createAddressOnlyTransport } from '@/lib/web-rpc.ts';

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
  email: z
    .string()
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .email('Email must be a valid'),
});
type FormSchemaType = z.infer<typeof formSchema>;

type LoginType = 'INTEGRATED' | 'DEDICATED' | 'EMAIL_CODE' | null;

type TargetRedirectFunction = () => Promise<void>;
type LoginFunction = (address: string, token: string) => Promise<void>;

type AuthFlowData = {
  email: string;
  flowToken: string;
  address: string;
};

function Index() {
  const { t, i18n } = useTranslation('login');
  const navigate = useNavigate();
  const searchParams: Record<string, string> = Route.useSearch();
  const [authFlowData, setAuthFlowData] = useState<AuthFlowData | null>(null);
  const [loginType, setLoginType] = useState<LoginType>(null);
  const systemInfo = useContext(SystemInfoContext);

  const targetRedirect: TargetRedirectFunction = useCallback(async () => {
    await navigate({
      to: searchParams.redirect ?? '/dashboard/user/instances',
      replace: true,
    });
  }, [navigate, searchParams.redirect]);

  const redirectWithCredentials: LoginFunction = useCallback(
    async (address: string, token: string) => {
      localStorage.setItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY, address.trim());
      localStorage.setItem(LOCAL_STORAGE_SERVER_TOKEN_KEY, token.trim());

      await targetRedirect();
    },
    [targetRedirect],
  );

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
              alt={t('header.image.alt')}
            />
            <p className="font-medium tracking-wide">{t('header.title')}</p>
          </div>
          {loginType === null && (
            <DefaultMenu
              setLoginType={setLoginType}
              demoLogin={targetRedirect}
            />
          )}
          {loginType === 'INTEGRATED' && (
            <IntegratedMenu redirectWithCredentials={redirectWithCredentials} />
          )}
          {loginType === 'DEDICATED' && (
            <DedicatedMenu
              setAuthFlowData={setAuthFlowData}
              setLoginType={setLoginType}
              redirectWithCredentials={redirectWithCredentials}
            />
          )}
          {loginType === 'EMAIL_CODE' && authFlowData !== null && (
            <EmailCodeMenu
              authFlowData={authFlowData}
              setLoginType={setLoginType}
              redirectWithCredentials={redirectWithCredentials}
            />
          )}
          <div>
            <div className="text-balance text-xs text-muted-foreground text-center">
              <p className="mb-1">
                {t('footer.version', {
                  version: APP_VERSION,
                  environment: APP_ENVIRONMENT,
                })}
              </p>
              {!systemInfo && (
                <>
                  {APP_ENVIRONMENT === 'production' && (
                    <a
                      className="text-blue-500"
                      href="https://preview.soulfiremc.com"
                    >
                      {t('footer.preview')}
                    </a>
                  )}
                  {APP_ENVIRONMENT === 'preview' && (
                    <a
                      className="text-blue-500"
                      href="https://app.soulfiremc.com"
                    >
                      {t('footer.production')}
                    </a>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-row justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="w-fit text-balance text-sm text-muted-foreground"
                    variant="ghost"
                  >
                    {languageEmoji(i18n.resolvedLanguage ?? i18n.language)}{' '}
                    {getLanguageName(
                      i18n.resolvedLanguage ?? i18n.language,
                      i18n.resolvedLanguage ?? i18n.language,
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>{t('common:locale')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={i18n.resolvedLanguage ?? i18n.language}
                    onValueChange={i18n.changeLanguage}
                  >
                    {(i18n.options.supportedLngs
                      ? i18n.options.supportedLngs
                      : []
                    )
                      .filter((lang) => lang !== 'cimode')
                      .map((lang) => (
                        <DropdownMenuRadioItem key={lang} value={lang}>
                          {languageEmoji(lang)} {getLanguageName(lang, lang)}
                        </DropdownMenuRadioItem>
                      ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function DefaultMenu(props: {
  setLoginType: (type: LoginType) => void;
  demoLogin: TargetRedirectFunction;
}) {
  const { t } = useTranslation('login');
  const systemInfo = useContext(SystemInfoContext);
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex flex-row gap-2 text-xl mx-auto">
          <SatelliteDishIcon />
          {t('connect.title')}
        </CardTitle>
        <CardDescription>{t('connect.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Button
            disabled={isDemo() || !systemInfo || systemInfo.mobile}
            className="w-full"
            variant="outline"
            onClick={() => props.setLoginType('INTEGRATED')}
          >
            <LaptopMinimalIcon className="size-5" />
            {t('connect.integrated.title')}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="w-fit" variant="outline">
                <InfoIcon className="size-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              {t('connect.integrated.description')}
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-row gap-2">
          <Button
            disabled={isDemo()}
            className="w-full"
            variant="outline"
            onClick={() => props.setLoginType('DEDICATED')}
          >
            <ServerIcon className="size-5" />
            {t('connect.dedicated.title')}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="w-fit" variant="outline">
                <InfoIcon className="size-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              {t('connect.dedicated.description')}
            </PopoverContent>
          </Popover>
        </div>
        {isDemo() && (
          <div className="flex flex-row gap-2">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                void props.demoLogin();
              }}
            >
              <FlaskConicalIcon className="size-5" />
              {t('connect.demo.title')}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button className="w-fit" variant="outline">
                  <InfoIcon className="size-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent>{t('connect.demo.description')}</PopoverContent>
            </Popover>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IntegratedMenu({
  redirectWithCredentials,
}: {
  redirectWithCredentials: LoginFunction;
}) {
  const { t } = useTranslation('login');
  const [latestLog, setLatestLog] = useState<string>(t('integrated.preparing'));

  // Hook for loading the integrated server
  useEffect(() => {
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
        loading: t('integrated.toast.loading'),
        success: t('integrated.toast.success'),
        error: (e) => {
          console.error(e);
          return t('integrated.toast.error');
        },
      },
    );

    return () => {
      cancel();
    };
  }, [redirectWithCredentials, t]);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex flex-row gap-2 text-xl mx-auto">
          <SatelliteDishIcon />
          {t('connect.title')}
        </CardTitle>
        <CardDescription className="whitespace-pre-wrap break-all truncate">
          {latestLog}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex h-32 w-full">
        <LoaderCircleIcon className="m-auto h-12 w-12 animate-spin" />
      </CardContent>
    </Card>
  );
}

function DedicatedMenu({
  redirectWithCredentials,
  setLoginType,
  setAuthFlowData,
}: {
  redirectWithCredentials: LoginFunction;
  setLoginType: (type: LoginType) => void;
  setAuthFlowData: (data: AuthFlowData) => void;
}) {
  const { t } = useTranslation('login');
  const [dedicatedType, setDedicatedType] = useState<'email' | 'token'>(
    'email',
  );
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address:
        localStorage.getItem(LOCAL_STORAGE_FORM_SERVER_ADDRESS_KEY) ?? '',
      token: localStorage.getItem(LOCAL_STORAGE_FORM_SERVER_TOKEN_KEY) ?? '',
      email: localStorage.getItem(LOCAL_STORAGE_FORM_SERVER_EMAIL_KEY) ?? '',
    },
  });

  function onSubmit(values: FormSchemaType) {
    const address = values.address.trim();
    localStorage.setItem(LOCAL_STORAGE_FORM_SERVER_ADDRESS_KEY, address);

    if (dedicatedType === 'token') {
      const token = values.token.trim();
      localStorage.setItem(LOCAL_STORAGE_FORM_SERVER_TOKEN_KEY, token);
      void redirectWithCredentials(address, token);
    } else if (dedicatedType === 'email') {
      const email = values.email.trim();
      localStorage.setItem(LOCAL_STORAGE_FORM_SERVER_EMAIL_KEY, email);
      const loginService = new LoginServiceClient(
        createAddressOnlyTransport(address),
      );
      toast.promise(
        loginService
          .login({
            email: email,
          })
          .then((response) => {
            setAuthFlowData({
              email: email,
              flowToken: response.response.authFlowToken,
              address: address,
            });
            setLoginType('EMAIL_CODE');
          }),
        {
          loading: t('dedicated.toast.loading'),
          success: t('dedicated.toast.success'),
          error: (e) => {
            console.error(e);
            return t('dedicated.toast.error');
          },
        },
      );
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex flex-row gap-2 text-xl mx-auto">
          <SatelliteDishIcon />
          {t('connect.title')}
        </CardTitle>
        <CardDescription>{t('dedicated.description')}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dedicated.form.address.title')}</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      inputMode="url"
                      placeholder={t('dedicated.form.address.placeholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('dedicated.form.address.description')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {dedicatedType === 'token' && (
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dedicated.form.token.title')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('dedicated.form.token.placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('dedicated.form.token.description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {dedicatedType === 'email' && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dedicated.form.email.title')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('dedicated.form.email.placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('dedicated.form.email.description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                setLoginType(null);
              }}
            >
              {t('dedicated.form.back')}
            </Button>
            <div className="flex flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDedicatedType(
                    dedicatedType === 'email' ? 'token' : 'email',
                  );
                }}
                type="button"
              >
                {dedicatedType === 'email'
                  ? t('dedicated.form.useToken')
                  : t('dedicated.form.useEmail')}
              </Button>
              <Button type="submit">{t('dedicated.form.login')}</Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function EmailCodeMenu(props: {
  authFlowData: AuthFlowData;
  setLoginType: (type: LoginType) => void;
  redirectWithCredentials: LoginFunction;
}) {
  const { t } = useTranslation('login');
  const [codeValue, setCodeValue] = useState<string>('');
  const [inputDisabled, setInputDisabled] = useState<boolean>(false);

  function setEmailCode(code: string) {
    if (code.length === 6) {
      setInputDisabled(true);
      toast.promise(
        new LoginServiceClient(
          createAddressOnlyTransport(props.authFlowData.address),
        )
          .emailCode({
            code: code,
            authFlowToken: props.authFlowData.flowToken,
          })
          .then(({ response }) => {
            if (response.next.oneofKind === 'success') {
              void props.redirectWithCredentials(
                props.authFlowData.address,
                response.next.success.token,
              );
            } else if (response.next.oneofKind === 'failure') {
              setInputDisabled(false);
              throw new Error(
                getEnumKeyByValue(
                  NextAuthFlowResponse_Failure_Reason,
                  response.next.failure.reason,
                ),
              );
            }

            setInputDisabled(false);
            setCodeValue('');
          }),
        {
          loading: t('emailCode.toast.loading'),
          success: t('emailCode.toast.success'),
          error: (e) => {
            setInputDisabled(false);
            setCodeValue('');
            console.error(e);
            return t('emailCode.toast.error');
          },
        },
      );
    } else {
      setCodeValue(code);
      setInputDisabled(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex flex-row gap-2 text-xl mx-auto">
          <SatelliteDishIcon />
          {t('connect.title')}
        </CardTitle>
        <CardDescription>
          <Trans
            t={t}
            i18nKey={'emailCode.description'}
            values={{
              email: props.authFlowData.email,
            }}
            components={{
              bold: <strong className="font-bold" />,
            }}
          />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 items-center">
        <InputOTP
          disabled={inputDisabled}
          autoFocus={true}
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={codeValue}
          onChange={setEmailCode}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            props.setLoginType('DEDICATED');
          }}
        >
          {t('emailCode.back')}
        </Button>
        {inputDisabled && (
          <LoaderCircleIcon className="h-10 w-10 animate-spin text-muted-foreground" />
        )}
      </CardFooter>
    </Card>
  );
}
