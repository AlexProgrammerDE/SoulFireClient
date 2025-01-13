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

export type CreateInstanceType = {
  friendlyName: string;
};

export function CreateInstancePopup({
  open,
  setOpen,
  onSubmit,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit: (values: CreateInstanceType) => void;
}) {
  const { t } = useTranslation('common');
  const formSchema = z.object({
    friendlyName: z
      .string()
      .min(3, t('dialog.createInstance.form.friendlyName.min'))
      .max(50, t('dialog.createInstance.form.friendlyName.max'))
      .regex(
        /^[a-zA-Z0-9 ]+$/,
        t('dialog.createInstance.form.friendlyName.regex'),
      ),
  });
  const form = useForm<CreateInstanceType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      friendlyName: '',
    },
  });

  return (
    <Form {...form}>
      <Credenza open={open} onOpenChange={setOpen}>
        <CredenzaContent className="pb-4">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          >
            <CredenzaHeader>
              <CredenzaTitle>{t('dialog.createInstance.title')}</CredenzaTitle>
              <CredenzaDescription>
                {t('dialog.createInstance.description')}
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody>
              <FormField
                control={form.control}
                name="friendlyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('dialog.createInstance.form.friendlyName.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder={t(
                          'dialog.createInstance.form.friendlyName.placeholder',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('dialog.createInstance.form.friendlyName.description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CredenzaBody>
            <CredenzaFooter className="justify-between">
              <CredenzaClose asChild>
                <Button variant="outline">
                  {t('dialog.createInstance.form.cancel')}
                </Button>
              </CredenzaClose>
              <Button type="submit">
                {t('dialog.createInstance.form.create')}
              </Button>
            </CredenzaFooter>
          </form>
        </CredenzaContent>
      </Credenza>
    </Form>
  );
}
