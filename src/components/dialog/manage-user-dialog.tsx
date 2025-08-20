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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { use } from 'react';
import { TransportContext } from '../providers/transport-context.tsx';
import { UserRole } from '@/generated/soulfire/common.ts';
import { UserServiceClient } from '@/generated/soulfire/user.client.ts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { getEnumEntries } from '@/lib/types.ts';
import { useRouteContext } from '@tanstack/react-router';
import { UserListResponse_User } from '@/generated/soulfire/user.ts';
import { PencilIcon, PlusIcon, XIcon } from 'lucide-react';
import { useAptabase } from '@aptabase/react';

export type FormType = {
  username: string;
  email: string;
  role: UserRole;
};

export function ManageUserDialog({
  open,
  setOpen,
  ...props
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
} & ({ mode: 'edit'; user: UserListResponse_User } | { mode: 'add' })) {
  const usersQueryOptions = useRouteContext({
    from: '/_dashboard/user/admin/users',
    select: (context) => context.usersQueryOptions,
  });
  const queryClient = useQueryClient();
  const transport = use(TransportContext);
  const { t } = useTranslation('admin');
  const { trackEvent } = useAptabase();
  const formSchema = z.object({
    username: z
      .string()
      .min(3, t('users.baseUserDialog.form.username.min'))
      .max(32, t('users.baseUserDialog.form.username.max'))
      .regex(
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
        t('users.baseUserDialog.form.username.regex'),
      ),
    email: z.email(),
    role: z.enum(UserRole),
  });
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: props.mode === 'edit' ? props.user.username : '',
      email: props.mode === 'edit' ? props.user.email : '',
      role: props.mode === 'edit' ? props.user.role : UserRole.USER,
    },
  });
  const submitMutation = useMutation({
    mutationFn: async (values: FormType) => {
      if (transport === null) {
        return;
      }

      void trackEvent(props.mode === 'add' ? 'create_user' : 'update_user', {
        role: values.role,
      });

      const userService = new UserServiceClient(transport);
      const promise =
        props.mode === 'add'
          ? userService
              .createUser({
                username: values.username,
                email: values.email,
                role: values.role,
              })
              .then((r) => r.response)
          : userService
              .updateUser({
                id: props.user.id,
                username: values.username,
                email: values.email,
                role: values.role,
              })
              .then((r) => r.response);
      toast.promise(promise, {
        loading:
          props.mode === 'add'
            ? t('users.addToast.loading')
            : t('users.updateToast.loading'),
        success: () => {
          setOpen(false);
          return props.mode === 'add'
            ? t('users.addToast.success')
            : t('users.updateToast.success');
        },
        error: (e) => {
          console.error(e);
          return props.mode === 'add'
            ? t('users.addToast.error')
            : t('users.updateToast.error');
        },
      });

      return promise;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: usersQueryOptions.queryKey,
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
              void form.handleSubmit((data) => submitMutation.mutate(data))(e)
            }
          >
            <CredenzaHeader>
              <CredenzaTitle>
                {props.mode === 'add'
                  ? t('users.addUserDialog.title')
                  : t('users.updateUserDialog.title')}
              </CredenzaTitle>
              <CredenzaDescription>
                {props.mode === 'add'
                  ? t('users.addUserDialog.description')
                  : t('users.updateUserDialog.description')}
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('users.baseUserDialog.form.username.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder={t(
                          'users.baseUserDialog.form.username.placeholder',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('users.baseUserDialog.form.username.description')}
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
                    <FormLabel>
                      {t('users.baseUserDialog.form.email.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'users.baseUserDialog.form.email.placeholder',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('users.baseUserDialog.form.email.description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('users.baseUserDialog.form.role.label')}
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getEnumEntries(UserRole).map((role) => (
                          <SelectItem
                            key={role.value}
                            value={String(role.value)}
                          >
                            {t(
                              `users.baseUserDialog.form.role.${role.key.toLowerCase()}`,
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('users.baseUserDialog.form.role.description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CredenzaBody>
            <CredenzaFooter className="justify-between">
              <CredenzaClose asChild>
                <Button variant="outline">
                  <XIcon />
                  {props.mode === 'add'
                    ? t('users.addUserDialog.form.cancel')
                    : t('users.updateUserDialog.form.cancel')}
                </Button>
              </CredenzaClose>
              <Button type="submit">
                {props.mode === 'add' ? <PlusIcon /> : <PencilIcon />}
                {props.mode === 'add'
                  ? t('users.addUserDialog.form.add')
                  : t('users.updateUserDialog.form.update')}
              </Button>
            </CredenzaFooter>
          </form>
        </CredenzaContent>
      </Credenza>
    </Form>
  );
}
