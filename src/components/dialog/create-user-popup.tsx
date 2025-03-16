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

export type CreateInstanceType = {
  username: string;
  email: string;
  role: UserRole;
};

export function CreateUserPopup({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const usersQueryOptions = useRouteContext({
    from: '/dashboard/user/admin/users',
    select: (context) => context.usersQueryOptions,
  });
  const queryClient = useQueryClient();
  const transport = useContext(TransportContext);
  const { t } = useTranslation('admin');
  const formSchema = z.object({
    username: z
      .string()
      .min(3, t('users.addUserDialog.form.username.min'))
      .max(32, t('users.addUserDialog.form.username.max'))
      .regex(/^[a-z0-9_.]+$/, t('users.addUserDialog.form.username.regex')),
    email: z.string().email(),
    role: z.nativeEnum(UserRole),
  });
  const form = useForm<CreateInstanceType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      role: UserRole.ADMIN,
    },
  });
  const addMutation = useMutation({
    mutationFn: async (values: CreateInstanceType) => {
      if (transport === null) {
        return;
      }

      const userService = new UserServiceClient(transport);
      const promise = userService
        .createUser({
          username: values.username,
          email: values.email,
          role: values.role,
        })
        .then((r) => r.response);
      toast.promise(promise, {
        loading: t('users.addToast.loading'),
        success: () => {
          setOpen(false);
          return t('users.addToast.success');
        },
        error: (e) => {
          console.error(e);
          return t('users.addToast.error');
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
              void form.handleSubmit((data) => addMutation.mutate(data))(e)
            }
          >
            <CredenzaHeader>
              <CredenzaTitle>{t('users.addUserDialog.title')}</CredenzaTitle>
              <CredenzaDescription>
                {t('users.addUserDialog.description')}
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('users.addUserDialog.form.username.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder={t(
                          'users.addUserDialog.form.username.placeholder',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('users.addUserDialog.form.username.description')}
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
                      {t('users.addUserDialog.form.email.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'users.addUserDialog.form.email.placeholder',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('users.addUserDialog.form.email.description')}
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
                      {t('users.addUserDialog.form.role.label')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
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
                              `users.addUserDialog.form.role.${role.key.toLowerCase()}`,
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('users.addUserDialog.form.role.description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CredenzaBody>
            <CredenzaFooter className="justify-between">
              <CredenzaClose asChild>
                <Button variant="outline">
                  {t('users.addUserDialog.form.cancel')}
                </Button>
              </CredenzaClose>
              <Button type="submit">{t('users.addUserDialog.form.add')}</Button>
            </CredenzaFooter>
          </form>
        </CredenzaContent>
      </Credenza>
    </Form>
  );
}
