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
import { use, useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  ClipboardIcon,
  FlaskConicalIcon,
  HeartHandshakeIcon,
  InfoIcon,
  KeyRoundIcon,
  LaptopMinimalIcon,
  LoaderCircleIcon,
  LogInIcon,
  MailIcon,
  PlayIcon,
  PlugZapIcon,
  RotateCcwIcon,
  SatelliteDishIcon,
  ServerIcon,
} from 'lucide-react';
import { emit, listen } from '@tauri-apps/api/event';
import { getEnumKeyByValue, SFServerType } from '@/lib/types.ts';
import { SystemInfoContext } from '@/components/providers/system-info-context.tsx';
import { invoke } from '@tauri-apps/api/core';
import {
  cancellablePromiseDefault,
  copyToClipboard,
  getLanguageName,
  isDemo,
  languageEmoji,
} from '@/lib/utils.tsx';
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
  DropdownMenuGroup,
  DropdownMenuItem,
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
import {
  createAddressOnlyTransport,
  setAuthentication,
} from '@/lib/web-rpc.ts';
import { ExternalLink } from '@/components/external-link.tsx';

const LOCAL_STORAGE_FORM_SERVER_ADDRESS_KEY = 'form-server-address';
const LOCAL_STORAGE_FORM_SERVER_TOKEN_KEY = 'form-server-token';
const LOCAL_STORAGE_FORM_SERVER_EMAIL_KEY = 'form-server-email';
const LOCAL_STORAGE_FORM_INTEGRATED_SERVER_JVM_ARGS =
  'form-integrated-server-jvm-args';
const LOCAL_STORAGE_FORM_MOBILE_INTEGRATED_SERVER_TOKEN_KEY =
  'form-mobile-integrated-server-token';

export const Route = createFileRoute('/')({
  component: Index,
});

const emailFormSchema = z.object({
  address: z
    .string()
    .min(1, 'Address is required')
    .max(255, 'Address is too long')
    .url('Address must be a valid URL'),
  email: z
    .string()
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .email('Email must be a valid'),
});
const tokenFormSchema = z.object({
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
type EmailFormSchemaType = z.infer<typeof emailFormSchema>;
type TokenFormSchemaType = z.infer<typeof tokenFormSchema>;

const integratedServerFormSchema = z.object({
  jvmArgs: z.string(),
});
type IntegratedServerFormSchemaType = z.infer<
  typeof integratedServerFormSchema
>;
const mobileIntegratedServerFormSchema = z.object({
  token: z
    .string()
    .min(1, 'Token is required')
    .max(255, 'Token is too long')
    .regex(
      /e[yw][A-Za-z0-9-_]+\.(?:e[yw][A-Za-z0-9-_]+)?\.[A-Za-z0-9-_]{2,}(?:(?:\.[A-Za-z0-9-_]{2,}){2})?/,
      'Must be a valid JWT token',
    ),
});
type MobileIntegratedServerFormSchemaType = z.infer<
  typeof mobileIntegratedServerFormSchema
>;

type LoginType = 'INTEGRATED' | 'DEDICATED' | 'EMAIL_CODE' | null;

type TargetRedirectFunction = () => Promise<void>;
type LoginFunction = (
  type: SFServerType,
  address: string,
  token: string,
) => Promise<void>;

type AuthFlowData = {
  email: string;
  flowToken: string;
  address: string;
};

const DEFAULT_JVM_ARGS = [
  '-XX:+EnableDynamicAgentLoading',
  '-XX:+UnlockExperimentalVMOptions',
  '-XX:+UseZGC',
  '-XX:+ZGenerational',
  '-XX:+AlwaysActAsServerClassMachine',
  '-XX:+UseNUMA',
  '-XX:+UseFastUnorderedTimeStamps',
  '-XX:+UseVectorCmov',
  '-XX:+UseCriticalJavaThreadPriority',
  '-Dsf.flags.v1=true',
];
const DEFAULT_JVM_ARGS_STRING = DEFAULT_JVM_ARGS.join(' ');
const DEFAULT_MOBILE_JVM_ARGS = [
  '-XX:+EnableDynamicAgentLoading',
  '-XX:+UnlockExperimentalVMOptions',
  // '-XX:+UseZGC',
  // '-XX:+ZGenerational',
  '-XX:+AlwaysActAsServerClassMachine',
  // '-XX:+UseNUMA',
  '-XX:+UseFastUnorderedTimeStamps',
  '-XX:+UseVectorCmov',
  '-XX:+UseCriticalJavaThreadPriority',
  '-Dsf.flags.v1=true',
];
const DEFAULT_MOBILE_JVM_ARGS_STRING = DEFAULT_MOBILE_JVM_ARGS.join(' ');

function Index() {
  const { t, i18n } = useTranslation('login');
  const navigate = useNavigate();
  const searchParams: Record<string, string> = Route.useSearch();
  const [authFlowData, setAuthFlowData] = useState<AuthFlowData | null>(null);
  const [loginType, setLoginType] = useState<LoginType>(null);
  const systemInfo = use(SystemInfoContext);

  const targetRedirect: TargetRedirectFunction = useCallback(async () => {
    await navigate({
      to: searchParams.redirect ?? '/user',
      replace: true,
    });
  }, [navigate, searchParams.redirect]);

  const redirectWithCredentials: LoginFunction = useCallback(
    async (type: SFServerType, address: string, token: string) => {
      setAuthentication(type, address.trim(), token.trim());

      await targetRedirect();
    },
    [targetRedirect],
  );

  const startIntegratedServer = () => {
    toast.promise(
      (async () => {
        await emit('kill-integrated-server', {});
        const args = localStorage.getItem(
          LOCAL_STORAGE_FORM_INTEGRATED_SERVER_JVM_ARGS,
        );
        const payload = await invoke('run_integrated_server', {
          jvmArgs:
            args === null
              ? DEFAULT_JVM_ARGS
              : args.split(' ').filter((str) => str !== ''),
        });
        const payloadString = payload as string;
        const split = payloadString.split('\n');

        await redirectWithCredentials('integrated', split[0], split[1]);
      })(),
      {
        loading: t('integrated.toast.loading'),
        success: t('integrated.toast.success'),
        error: (e) => {
          setLoginType(null);
          console.error(e);
          return t('integrated.toast.error');
        },
      },
    );
  };

  return (
    <ScrollArea className="relative h-dvh w-full px-4">
      <svg className="fill-muted/30 absolute top-0 right-0 bottom-0 left-0 z-[-1] h-dvh w-dvw">
        <defs>
          <pattern
            id="circuitPattern"
            x="0"
            y="0"
            width="304"
            height="304"
            patternUnits="userSpaceOnUse"
          >
            <path d="M44.1 224a5 5 0 1 1 0 2H0v-2h44.1zm160 48a5 5 0 1 1 0 2H82v-2h122.1zm57.8-46a5 5 0 1 1 0-2H304v2h-42.1zm0 16a5 5 0 1 1 0-2H304v2h-42.1zm6.2-114a5 5 0 1 1 0 2h-86.2a5 5 0 1 1 0-2h86.2zm-256-48a5 5 0 1 1 0 2H0v-2h12.1zm185.8 34a5 5 0 1 1 0-2h86.2a5 5 0 1 1 0 2h-86.2zM258 12.1a5 5 0 1 1-2 0V0h2v12.1zm-64 208a5 5 0 1 1-2 0v-54.2a5 5 0 1 1 2 0v54.2zm48-198.2V80h62v2h-64V21.9a5 5 0 1 1 2 0zm16 16V64h46v2h-48V37.9a5 5 0 1 1 2 0zm-128 96V208h16v12.1a5 5 0 1 1-2 0V210h-16v-76.1a5 5 0 1 1 2 0zm-5.9-21.9a5 5 0 1 1 0 2H114v48H85.9a5 5 0 1 1 0-2H112v-48h12.1zm-6.2 130a5 5 0 1 1 0-2H176v-74.1a5 5 0 1 1 2 0V242h-60.1zm-16-64a5 5 0 1 1 0-2H114v48h10.1a5 5 0 1 1 0 2H112v-48h-10.1zM66 284.1a5 5 0 1 1-2 0V274H50v30h-2v-32h18v12.1zM236.1 176a5 5 0 1 1 0 2H226v94h48v32h-2v-30h-48v-98h12.1zm25.8-30a5 5 0 1 1 0-2H274v44.1a5 5 0 1 1-2 0V146h-10.1zm-64 96a5 5 0 1 1 0-2H208v-80h16v-14h-42.1a5 5 0 1 1 0-2H226v18h-16v80h-12.1zm86.2-210a5 5 0 1 1 0 2H272V0h2v32h10.1zM98 101.9V146H53.9a5 5 0 1 1 0-2H96v-42.1a5 5 0 1 1 2 0zM53.9 34a5 5 0 1 1 0-2H80V0h2v34H53.9zm60.1 3.9V66H82v64H69.9a5 5 0 1 1 0-2H80V64h32V37.9a5 5 0 1 1 2 0zM101.9 82a5 5 0 1 1 0-2H128V37.9a5 5 0 1 1 2 0V82h-28.1zm16-64a5 5 0 1 1 0-2H146v44.1a5 5 0 1 1-2 0V18h-26.1zm102.2 270a5 5 0 1 1 0 2H98v14h-2v-16h124.1zM242 149.9V160h16v34h-16v62h48v48h-2v-46h-48v-66h16v-30h-16v-12.1a5 5 0 1 1 2 0zM53.9 18a5 5 0 1 1 0-2H64V2H48V0h18v18H53.9zm112 32a5 5 0 1 1 0-2H192V0h50v2h-48v48h-28.1zm-48-48a5 5 0 0 1-9.8-2h2.07a3 3 0 1 0 5.66 0H178v34h-18V21.9a5 5 0 1 1 2 0V32h14V2h-58.1zm0 96a5 5 0 1 1 0-2H137l32-32h39V21.9a5 5 0 1 1 2 0V66h-40.17l-32 32H117.9zm28.1 90.1a5 5 0 1 1-2 0v-76.51L175.59 80H224V21.9a5 5 0 1 1 2 0V82h-49.59L146 112.41v75.69zm16 32a5 5 0 1 1-2 0v-99.51L184.59 96H300.1a5 5 0 0 1 3.9-3.9v2.07a3 3 0 0 0 0 5.66v2.07a5 5 0 0 1-3.9-3.9H185.41L162 121.41v98.69zm-144-64a5 5 0 1 1-2 0v-3.51l48-48V48h32V0h2v50H66v55.41l-48 48v2.69zM50 53.9v43.51l-48 48V208h26.1a5 5 0 1 1 0 2H0v-65.41l48-48V53.9a5 5 0 1 1 2 0zm-16 16V89.41l-34 34v-2.82l32-32V69.9a5 5 0 1 1 2 0zM12.1 32a5 5 0 1 1 0 2H9.41L0 43.41V40.6L8.59 32h3.51zm265.8 18a5 5 0 1 1 0-2h18.69l7.41-7.41v2.82L297.41 50H277.9zm-16 160a5 5 0 1 1 0-2H288v-71.41l16-16v2.82l-14 14V210h-28.1zm-208 32a5 5 0 1 1 0-2H64v-22.59L40.59 194H21.9a5 5 0 1 1 0-2H41.41L66 216.59V242H53.9zm150.2 14a5 5 0 1 1 0 2H96v-56.6L56.6 162H37.9a5 5 0 1 1 0-2h19.5L98 200.6V256h106.1zm-150.2 2a5 5 0 1 1 0-2H80v-46.59L48.59 178H21.9a5 5 0 1 1 0-2H49.41L82 208.59V258H53.9zM34 39.8v1.61L9.41 66H0v-2h8.59L32 40.59V0h2v39.8zM2 300.1a5 5 0 0 1 3.9 3.9H3.83A3 3 0 0 0 0 302.17V256h18v48h-2v-46H2v42.1zM34 241v63h-2v-62H0v-2h34v1zM17 18H0v-2h16V0h2v18h-1zm273-2h14v2h-16V0h2v16zm-32 273v15h-2v-14h-14v14h-2v-16h18v1zM0 92.1A5.02 5.02 0 0 1 6 97a5 5 0 0 1-6 4.9v-2.07a3 3 0 1 0 0-5.66V92.1zM80 272h2v32h-2v-32zm37.9 32h-2.07a3 3 0 0 0-5.66 0h-2.07a5 5 0 0 1 9.8 0zM5.9 0A5.02 5.02 0 0 1 0 5.9V3.83A3 3 0 0 0 3.83 0H5.9zm294.2 0h2.07A3 3 0 0 0 304 3.83V5.9a5 5 0 0 1-3.9-5.9zm3.9 300.1v2.07a3 3 0 0 0-1.83 1.83h-2.07a5 5 0 0 1 3.9-3.9zM97 100a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-48 32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 48a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16-64a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 96a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-144a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-96 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm96 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16-64a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-32 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM49 36a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-32 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM33 68a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-48a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 240a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16-64a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16-32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm80-176a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 48a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm112 176a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 180a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 84a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 64a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
          </pattern>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#circuitPattern)"
        />
      </svg>
      <main className="flex min-h-dvh w-full flex-col">
        <div className="m-auto flex w-full max-w-lg flex-col gap-6">
          <div className="flex flex-row items-center justify-center gap-2 text-center">
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
            <IntegratedMenu
              setLoginType={setLoginType}
              redirectWithCredentials={redirectWithCredentials}
              startIntegratedServer={startIntegratedServer}
            />
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
            <div className="text-muted-foreground text-center text-xs text-balance">
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
                    className="text-muted-foreground w-fit text-sm text-balance"
                    variant="ghost"
                  >
                    {languageEmoji(i18n.resolvedLanguage ?? i18n.language)}{' '}
                    {getLanguageName(
                      i18n.resolvedLanguage ?? i18n.language,
                      i18n.resolvedLanguage ?? i18n.language,
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>{t('common:locale')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={i18n.resolvedLanguage ?? i18n.language}
                    onValueChange={(lang) => void i18n.changeLanguage(lang)}
                    className="grid grid-cols-1 md:grid-cols-2"
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
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <ExternalLink href="https://translate.soulfiremc.com">
                        <HeartHandshakeIcon />
                        {t('footer.helpTranslate')}
                      </ExternalLink>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </main>
    </ScrollArea>
  );
}

function LoginCardTitle() {
  const { t } = useTranslation('login');
  return (
    <CardTitle className="mx-auto flex flex-row items-center gap-2 text-xl">
      <SatelliteDishIcon />
      {t('connect.title')}
    </CardTitle>
  );
}

function DefaultMenu(props: {
  setLoginType: (type: LoginType) => void;
  demoLogin: TargetRedirectFunction;
}) {
  const { t } = useTranslation('login');
  const systemInfo = use(SystemInfoContext);
  const integratedDisabled = isDemo() || !systemInfo;
  return (
    <Card>
      <CardHeader className="text-center">
        <LoginCardTitle />
        <CardDescription>{t('connect.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Button
            autoFocus
            disabled={integratedDisabled}
            className="grow"
            variant="outline"
            onClick={() => {
              props.setLoginType('INTEGRATED');
            }}
          >
            <LaptopMinimalIcon />
            {t('connect.integrated.title')}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="w-fit" variant="outline">
                <InfoIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              {t('connect.integrated.description')}
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-row gap-2">
          <Button
            autoFocus={integratedDisabled}
            disabled={isDemo()}
            className="grow"
            variant="outline"
            onClick={() => props.setLoginType('DEDICATED')}
          >
            <ServerIcon />
            {t('connect.dedicated.title')}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="w-fit" variant="outline">
                <InfoIcon />
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
              autoFocus
              className="grow"
              variant="outline"
              onClick={() => {
                void props.demoLogin();
              }}
            >
              <FlaskConicalIcon />
              {t('connect.demo.title')}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button className="w-fit" variant="outline">
                  <InfoIcon />
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

type IntegratedState = 'configure' | 'loading' | 'mobile';

function IntegratedMenu({
  redirectWithCredentials,
  setLoginType,
  startIntegratedServer,
}: {
  redirectWithCredentials: LoginFunction;
  setLoginType: (type: LoginType) => void;
  startIntegratedServer: () => void;
}) {
  const [integratedState, setIntegratedState] =
    useState<IntegratedState>('configure');

  switch (integratedState) {
    case 'configure':
      return (
        <IntegratedConfigureMenu
          setLoginType={setLoginType}
          setIntegratedState={setIntegratedState}
          startIntegratedServer={startIntegratedServer}
        />
      );
    case 'loading':
      return (
        <IntegratedLoadingMenu
          redirectWithCredentials={redirectWithCredentials}
        />
      );
    case 'mobile':
      return (
        <IntegratedMobileMenu
          setIntegratedState={setIntegratedState}
          redirectWithCredentials={redirectWithCredentials}
        />
      );
  }
}

function IntegratedConfigureMenu({
  setLoginType,
  setIntegratedState,
  startIntegratedServer,
}: {
  setLoginType: (type: LoginType) => void;
  setIntegratedState: (state: IntegratedState) => void;
  startIntegratedServer: () => void;
}) {
  const systemInfo = use(SystemInfoContext);
  const { t } = useTranslation('login');
  const form = useForm<IntegratedServerFormSchemaType>({
    resolver: zodResolver(integratedServerFormSchema),
    defaultValues: {
      jvmArgs:
        localStorage.getItem(LOCAL_STORAGE_FORM_INTEGRATED_SERVER_JVM_ARGS) ??
        (systemInfo?.mobile
          ? DEFAULT_MOBILE_JVM_ARGS_STRING
          : DEFAULT_JVM_ARGS_STRING),
    },
  });

  function onSubmit(values: IntegratedServerFormSchemaType) {
    const jvmArgs = values.jvmArgs.trim();
    localStorage.setItem(
      LOCAL_STORAGE_FORM_INTEGRATED_SERVER_JVM_ARGS,
      jvmArgs,
    );

    if (systemInfo?.mobile) {
      setIntegratedState('mobile');
    } else {
      setIntegratedState('loading');
      startIntegratedServer();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}>
        <Card>
          <CardHeader className="text-center">
            <LoginCardTitle />
            <CardDescription>{t('integrated.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="jvmArgs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('integrated.form.jvmArgs.title')}</FormLabel>
                  <FormControl>
                    <div className="flex flex-row gap-2">
                      <Input
                        autoFocus
                        type="text"
                        inputMode="text"
                        placeholder={t('integrated.form.jvmArgs.placeholder')}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={field.value === DEFAULT_JVM_ARGS_STRING}
                        onClick={() => {
                          field.onChange('jvmArgs', DEFAULT_JVM_ARGS_STRING);
                          localStorage.setItem(
                            LOCAL_STORAGE_FORM_INTEGRATED_SERVER_JVM_ARGS,
                            DEFAULT_JVM_ARGS_STRING,
                          );
                        }}
                      >
                        <RotateCcwIcon />
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    <Trans
                      i18nKey="login:integrated.form.jvmArgs.description"
                      components={{ bold: <strong className="text-nowrap" /> }}
                    />
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
              type="button"
            >
              <ArrowLeftIcon />
              {t('integrated.form.back')}
            </Button>
            <Button type="submit">
              <PlayIcon />
              {t('integrated.form.start')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

function IntegratedLoadingMenu({
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
    return () => {
      cancel();
    };
  }, [redirectWithCredentials, t]);

  return (
    <Card>
      <CardHeader className="text-center">
        <LoginCardTitle />
        <CardDescription className="truncate break-all whitespace-pre-wrap">
          {latestLog}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex h-32 w-full">
        <LoaderCircleIcon className="m-auto h-12 w-12 animate-spin" />
      </CardContent>
    </Card>
  );
}

function IntegratedMobileMenu({
  setIntegratedState,
  redirectWithCredentials,
}: {
  setIntegratedState: (state: IntegratedState) => void;
  redirectWithCredentials: LoginFunction;
}) {
  const systemInfo = use(SystemInfoContext);
  const { t } = useTranslation('login');
  const runCommand = `bash <(curl -s https://raw.githubusercontent.com/AlexProgrammerDE/SoulFireClient/refs/heads/main/scripts/termux_setup.sh) ${systemInfo?.sfServerVersion} "${localStorage.getItem(LOCAL_STORAGE_FORM_INTEGRATED_SERVER_JVM_ARGS)}"`;
  const form = useForm<MobileIntegratedServerFormSchemaType>({
    resolver: zodResolver(mobileIntegratedServerFormSchema),
    defaultValues: {
      token:
        localStorage.getItem(
          LOCAL_STORAGE_FORM_MOBILE_INTEGRATED_SERVER_TOKEN_KEY,
        ) ?? '',
    },
  });

  function onSubmit(values: MobileIntegratedServerFormSchemaType) {
    const token = values.token.trim();
    localStorage.setItem(
      LOCAL_STORAGE_FORM_MOBILE_INTEGRATED_SERVER_TOKEN_KEY,
      token,
    );
    void redirectWithCredentials('integrated', 'http://localhost:38765', token);
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}>
        <Card>
          <CardHeader className="text-center">
            <LoginCardTitle />
            <CardDescription>
              {t('integrated.mobile.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormItem>
              <FormLabel>
                {t('integrated.mobile.form.termuxCommand.title')}
              </FormLabel>
              <div className="flex flex-row gap-2">
                <Input
                  autoFocus
                  type="text"
                  inputMode="text"
                  readOnly
                  value={runCommand}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    copyToClipboard(runCommand);
                    toast.success(t('common:copiedToClipboard'));
                  }}
                >
                  <ClipboardIcon />
                </Button>
              </div>
              <FormDescription>
                <Trans
                  i18nKey="login:integrated.mobile.form.termuxCommand.description"
                  components={{
                    a: (
                      <ExternalLink
                        href="https://wiki.termux.com/wiki/Installation"
                        className="text-nowrap text-blue-500"
                      />
                    ),
                    copy: (
                      <button
                        type="button"
                        className="font-bold text-blue-500"
                        onClick={() => {
                          copyToClipboard('generate-token api');
                          toast.success(t('common:copiedToClipboard'));
                        }}
                      />
                    ),
                  }}
                />
              </FormDescription>
            </FormItem>
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('integrated.mobile.form.token.title')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="text"
                      placeholder={t(
                        'integrated.mobile.form.token.placeholder',
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    <Trans
                      i18nKey="login:integrated.mobile.form.token.description"
                      components={{ bold: <strong className="text-nowrap" /> }}
                    />
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
                setIntegratedState('configure');
              }}
              type="button"
            >
              <ArrowLeftIcon />
              {t('integrated.mobile.form.back')}
            </Button>
            <Button type="submit">
              <PlugZapIcon />
              {t('integrated.mobile.form.connect')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

type DedicatedType = 'email' | 'token';

function DedicatedMenu({
  redirectWithCredentials,
  setLoginType,
  setAuthFlowData,
}: {
  redirectWithCredentials: LoginFunction;
  setLoginType: (type: LoginType) => void;
  setAuthFlowData: (data: AuthFlowData) => void;
}) {
  const [dedicatedType, setDedicatedType] = useState<DedicatedType>('email');

  return (
    <>
      {dedicatedType === 'email' && (
        <EmailForm
          setDedicatedType={setDedicatedType}
          setLoginType={setLoginType}
          setAuthFlowData={setAuthFlowData}
        />
      )}
      {dedicatedType === 'token' && (
        <TokenForm
          redirectWithCredentials={redirectWithCredentials}
          setDedicatedType={setDedicatedType}
          setLoginType={setLoginType}
        />
      )}
    </>
  );
}

function EmailForm({
  setLoginType,
  setAuthFlowData,
  setDedicatedType,
}: {
  setLoginType: (type: LoginType) => void;
  setAuthFlowData: (data: AuthFlowData) => void;
  setDedicatedType: (type: DedicatedType) => void;
}) {
  const { t } = useTranslation('login');
  const form = useForm<EmailFormSchemaType>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      address:
        localStorage.getItem(LOCAL_STORAGE_FORM_SERVER_ADDRESS_KEY) ?? '',
      email: localStorage.getItem(LOCAL_STORAGE_FORM_SERVER_EMAIL_KEY) ?? '',
    },
  });

  function onSubmit(values: EmailFormSchemaType) {
    const address = values.address.trim();
    localStorage.setItem(LOCAL_STORAGE_FORM_SERVER_ADDRESS_KEY, address);

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

  return (
    <Form {...form}>
      <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}>
        <Card>
          <CardHeader className="text-center">
            <LoginCardTitle />
            <CardDescription>{t('dedicated.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dedicated.form.address.title')}</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                setLoginType(null);
              }}
              type="button"
            >
              <ArrowLeftIcon />
              {t('dedicated.form.back')}
            </Button>
            <div className="flex flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDedicatedType('token');
                }}
                type="button"
              >
                <KeyRoundIcon />
                {t('dedicated.form.useToken')}
              </Button>
              <Button type="submit">
                <LogInIcon />
                {t('dedicated.form.login')}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

function TokenForm({
  redirectWithCredentials,
  setLoginType,
  setDedicatedType,
}: {
  redirectWithCredentials: LoginFunction;
  setLoginType: (type: LoginType) => void;
  setDedicatedType: (type: DedicatedType) => void;
}) {
  const { t } = useTranslation('login');
  const form = useForm<TokenFormSchemaType>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      address:
        localStorage.getItem(LOCAL_STORAGE_FORM_SERVER_ADDRESS_KEY) ?? '',
      token: localStorage.getItem(LOCAL_STORAGE_FORM_SERVER_TOKEN_KEY) ?? '',
    },
  });

  function onSubmit(values: TokenFormSchemaType) {
    const address = values.address.trim();
    localStorage.setItem(LOCAL_STORAGE_FORM_SERVER_ADDRESS_KEY, address);

    const token = values.token.trim();
    localStorage.setItem(LOCAL_STORAGE_FORM_SERVER_TOKEN_KEY, token);
    void redirectWithCredentials('dedicated', address, token);
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}>
        <Card>
          <CardHeader className="text-center">
            <LoginCardTitle />
            <CardDescription>{t('dedicated.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dedicated.form.address.title')}</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                setLoginType(null);
              }}
              type="button"
            >
              <ArrowLeftIcon />
              {t('dedicated.form.back')}
            </Button>
            <div className="flex flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDedicatedType('email');
                }}
                type="button"
              >
                <MailIcon />
                {t('dedicated.form.useEmail')}
              </Button>
              <Button type="submit">
                <LogInIcon />
                {t('dedicated.form.login')}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
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
    setCodeValue(code);
    if (code.length !== 6) {
      setInputDisabled(false);
      return;
    }

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
              'dedicated',
              props.authFlowData.address,
              response.next.success.token,
            );
          } else if (response.next.oneofKind === 'failure') {
            setInputDisabled(false);
            setCodeValue('');
            throw new Error(
              getEnumKeyByValue(
                NextAuthFlowResponse_Failure_Reason,
                response.next.failure.reason,
              ),
            );
          } else {
            setInputDisabled(false);
            setCodeValue('');
            throw new Error('Unknown response type');
          }
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
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <LoginCardTitle />
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
      <CardContent className="flex flex-col items-center gap-4">
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
          <ArrowLeftIcon />
          {t('emailCode.back')}
        </Button>
        {inputDisabled && (
          <LoaderCircleIcon className="text-muted-foreground h-10 w-10 animate-spin" />
        )}
      </CardFooter>
    </Card>
  );
}
