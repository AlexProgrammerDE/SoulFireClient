import { useAptabase } from "@aptabase/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { PlusIcon, XIcon } from "lucide-react";
import { createContext, type ReactNode, use, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button.tsx";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { InstanceServiceClient } from "@/generated/soulfire/instance.client.ts";
import { TransportContext } from "../providers/transport-context.tsx";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "../ui/credenza.tsx";

export const CreateInstanceContext = createContext<{
  openCreateInstance: () => void;
}>(null as never);

export function CreateInstanceProvider(props: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CreateInstanceContext
        value={{
          openCreateInstance: () => {
            setOpen(true);
          },
        }}
      >
        {props.children}
      </CreateInstanceContext>
      <CreateInstanceDialog open={open} setOpen={setOpen} />
    </>
  );
}

export type FormType = {
  friendlyName: string;
};

function CreateInstanceDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const instanceListQueryOptions = useRouteContext({
    from: "/_dashboard",
    select: (context) => context.instanceListQueryOptions,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const transport = use(TransportContext);
  const { trackEvent } = useAptabase();
  const { t } = useTranslation("common");
  const formSchema = z.object({
    friendlyName: z
      .string()
      .min(3, t("dialog.createInstance.form.friendlyName.min"))
      .max(32, t("dialog.createInstance.form.friendlyName.max"))
      .regex(
        /^[a-zA-Z0-9 ]+$/,
        t("dialog.createInstance.form.friendlyName.regex"),
      ),
  });
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      friendlyName: "",
    },
  });
  const addMutation = useMutation({
    mutationFn: async (values: FormType) => {
      if (transport === null) {
        return;
      }

      void trackEvent("create_instance");

      const instanceService = new InstanceServiceClient(transport);
      const promise = instanceService
        .createInstance({
          friendlyName: values.friendlyName,
        })
        .then((r) => r.response);
      toast.promise(promise, {
        loading: t("dialog.createInstance.createToast.loading"),
        success: (r) => {
          setOpen(false);
          void navigate({
            to: "/instance/$instance",
            params: { instance: r.id },
          });
          return t("dialog.createInstance.createToast.success");
        },
        error: (e) => {
          console.error(e);
          return t("dialog.createInstance.createToast.error");
        },
      });

      return promise;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceListQueryOptions.queryKey,
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
              <CredenzaTitle>{t("dialog.createInstance.title")}</CredenzaTitle>
              <CredenzaDescription>
                {t("dialog.createInstance.description")}
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody>
              <FormField
                control={form.control}
                name="friendlyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dialog.createInstance.form.friendlyName.label")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder={t(
                          "dialog.createInstance.form.friendlyName.placeholder",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("dialog.createInstance.form.friendlyName.description")}
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
                  {t("dialog.createInstance.form.cancel")}
                </Button>
              </CredenzaClose>
              <Button type="submit">
                <PlusIcon />
                {t("dialog.createInstance.form.create")}
              </Button>
            </CredenzaFooter>
          </form>
        </CredenzaContent>
      </Credenza>
    </Form>
  );
}
