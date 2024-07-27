import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from './ui/credenza';
import { Button } from '@/components/ui/button.tsx';
import { useNavigate } from '@tanstack/react-router';
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

const formSchema = z.object({
  friendlyName: z
    .string()
    .min(1, 'Friendly name is required')
    .max(255, 'Friendly name is too long')
    .regex(
      /^[a-zA-Z0-9 ]+$/,
      'Friendly name can only contain letters, numbers, and spaces',
    ),
});
export type CreateInstanceType = z.infer<typeof formSchema>;

export function CreateInstancePopup({
  open,
  setOpen,
  onSubmit,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit: (values: CreateInstanceType) => void;
}) {
  const form = useForm<CreateInstanceType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      friendlyName: '',
    },
  });

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaContent>
        <Form {...form}>
          <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}>
            <CredenzaHeader>
              <CredenzaTitle>Create a new instance</CredenzaTitle>
              <CredenzaDescription>
                Instances need friendly names for you to distinguish them. It It
                can be any name you want, for example, "My Minecraft Bot".
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="space-y-4">
              <FormField
                control={form.control}
                name="friendlyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Friendly name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Minecraft Bot" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is how you'll identify this instance.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CredenzaBody>
            <CredenzaFooter className="justify-between">
              <CredenzaClose asChild>
                <Button variant="outline">Close</Button>
              </CredenzaClose>
              <Button type="submit">Create</Button>
            </CredenzaFooter>
          </form>
        </Form>
      </CredenzaContent>
    </Credenza>
  );
}
