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
import { useContext } from 'react';
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

export type CreateInstanceType = {
  username: string;
  email: string;
  role: UserRole;
};

export function UpdateUserPopup({
  user,
  open,
  setOpen,
}: {
  user: UserListResponse_User;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const usersQueryOptions = useRouteContext({
    from: '/_dashboard/user/admin/users',
    select: (context) => context.usersQueryOptions,
  });
  const queryClient = useQueryClient();
  const transport = useContext(TransportContext);
  const { t } = useTranslation('admin');
  const formSchema = z.object({
    username: z
      .string()
      .min(3, t('users.baseUserDialog.form.username.min'))
      .max(32, t('users.baseUserDialog.form.username.max'))
      .regex(
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
        t('users.baseUserDialog.form.username.regex'),
      ),
    email: z.string().email(),
    role: z.nativeEnum(UserRole),
  });
  const form = useForm<CreateInstanceType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
  const updateMutation = useMutation({
    mutationFn: async (values: CreateInstanceType) => {
      if (transport === null) {
        return;
      }

      const userService = new UserServiceClient(transport);
      const promise = userService
        .updateUser({
          id: user.id,
          username: values.username,
          email: values.email,
          role: values.role,
        })
        .then((r) => r.response);
      toast.promise(promise, {
        loading: t('users.updateToast.loading'),
        success: () => {
          setOpen(false);
          return t('users.updateToast.success');
        },
        error: (e) => {
          console.error(e);
          return t('users.updateToast.error');
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
              void form.handleSubmit((data) => updateMutation.mutate(data))(e)
            }
          >
            <CredenzaHeader>
              <CredenzaTitle>{t('users.updateUserDialog.title')}</CredenzaTitle>
              <CredenzaDescription>
                {t('users.updateUserDialog.description')}
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
                  {t('users.updateUserDialog.form.cancel')}
                </Button>
              </CredenzaClose>
              <Button type="submit">
                {t('users.updateUserDialog.form.add')}
              </Button>
            </CredenzaFooter>
          </form>
        </CredenzaContent>
      </Credenza>
    </Form>
  );
}
