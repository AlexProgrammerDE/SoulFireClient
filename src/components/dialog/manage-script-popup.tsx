import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from '../ui/credenza.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useTranslation } from 'react-i18next';
import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useContext } from 'react';
import { TransportContext } from '../providers/transport-context.tsx';
import { GlobalPermission } from '@/generated/soulfire/common.ts';
import { ScriptServiceClient } from '@/generated/soulfire/script.client.ts';
import {
  ScriptListResponse_Script,
  ScriptScope,
} from '@/generated/soulfire/script.ts';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { hasGlobalPermission } from '@/lib/utils.tsx';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';

export type FormType = {
  scriptName: string;
  elevatedPermissions: boolean;
};

export function ManageScriptPopup({
  open,
  setOpen,
  scope,
  scriptsQueryKey,
  ...props
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  scope: ScriptScope;
  scriptsQueryKey: QueryKey;
} & ({ mode: 'edit'; script: ScriptListResponse_Script } | { mode: 'add' })) {
  const queryClient = useQueryClient();
  const transport = useContext(TransportContext);
  const clientData = useContext(ClientInfoContext);
  const { t } = useTranslation('common');
  const formSchema = z.object({
    scriptName: z
      .string()
      .min(3, t('scripts.baseScriptDialog.form.scriptName.min'))
      .max(32, t('scripts.baseScriptDialog.form.scriptName.max'))
      .regex(
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
        t('scripts.baseScriptDialog.form.scriptName.regex'),
      ),
    elevatedPermissions: z.boolean(),
  });
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scriptName: props.mode === 'edit' ? props.script.scriptName : '',
      elevatedPermissions:
        props.mode === 'edit' ? props.script.elevatedPermissions : false,
    },
  });
  const addMutation = useMutation({
    mutationFn: async (values: FormType) => {
      if (transport === null) {
        return;
      }

      const scriptService = new ScriptServiceClient(transport);
      const promise =
        props.mode === 'add'
          ? scriptService
              .createScript({
                scope,
                scriptName: values.scriptName,
                elevatedPermissions: values.elevatedPermissions,
              })
              .then((r) => r.response)
          : scriptService
              .updateScript({
                id: props.script.id,
                scriptName: values.scriptName,
                elevatedPermissions: values.elevatedPermissions,
              })
              .then((r) => r.response);
      toast.promise(promise, {
        loading:
          props.mode === 'add'
            ? t('scripts.addToast.loading')
            : t('scripts.updateToast.loading'),
        success: () => {
          setOpen(false);
          return props.mode === 'add'
            ? t('scripts.addToast.success')
            : t('scripts.updateToast.success');
        },
        error: (e) => {
          console.error(e);
          return props.mode === 'add'
            ? t('scripts.addToast.error')
            : t('scripts.updateToast.error');
        },
      });

      return promise;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: scriptsQueryKey,
      });
    },
  });

  return (
    <Form {...form}>
      <Credenza open={open} onOpenChange={setOpen}>
        <CredenzaContent className="pb-4">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) =>
              void form.handleSubmit((data) => addMutation.mutate(data))(e)
            }
          >
            <CredenzaHeader>
              <CredenzaTitle>
                {props.mode === 'add'
                  ? t('scripts.addScriptDialog.title')
                  : t('scripts.updateScriptDialog.title')}
              </CredenzaTitle>
              <CredenzaDescription>
                {props.mode === 'add'
                  ? t('scripts.addScriptDialog.description')
                  : t('scripts.updateScriptDialog.description')}
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="scriptName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('scripts.baseScriptDialog.form.scriptName.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder={t(
                          'scripts.baseScriptDialog.form.scriptName.placeholder',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        'scripts.baseScriptDialog.form.scriptName.description',
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="elevatedPermissions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        disabled={
                          !hasGlobalPermission(
                            clientData,
                            GlobalPermission.ELEVATE_SCRIPT_PERMISSIONS,
                          )
                        }
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {t(
                          'scripts.baseScriptDialog.form.elevatedPermissions.label',
                        )}
                      </FormLabel>
                      <FormDescription>
                        {t(
                          'scripts.baseScriptDialog.form.elevatedPermissions.description',
                        )}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CredenzaBody>
            <CredenzaFooter className="justify-between">
              <CredenzaClose asChild>
                <Button variant="outline">
                  {props.mode === 'add'
                    ? t('scripts.addScriptDialog.form.cancel')
                    : t('scripts.updateScriptDialog.form.cancel')}
                </Button>
              </CredenzaClose>
              <Button type="submit">
                {props.mode === 'add'
                  ? t('scripts.addScriptDialog.form.add')
                  : t('scripts.updateScriptDialog.form.update')}
              </Button>
            </CredenzaFooter>
          </form>
        </CredenzaContent>
      </Credenza>
    </Form>
  );
}
