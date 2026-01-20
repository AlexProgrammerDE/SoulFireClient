import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { emit } from "@tauri-apps/api/event";
import {
  BugIcon,
  LoaderCircleIcon,
  LogOutIcon,
  RotateCwIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { isTauri, runAsync } from "@/lib/utils.tsx";
import { logOut } from "@/lib/web-rpc.ts";

export function ErrorComponent({ error }: { error: Error }) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();
  const [revalidating, setRevalidating] = useState(false);

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  const revalidate = useCallback(() => {
    setRevalidating(true);
    void router.invalidate().finally(() => {
      setRevalidating(false);
    });
  }, [router]);

  useEffect(() => {
    const interval = setInterval(revalidate, 1000 * 5);

    return () => {
      clearInterval(interval);
    };
  }, [revalidate]);

  return (
    <div className="flex size-full grow">
      <Card className="m-auto flex flex-col">
        <CardHeader>
          <CardTitle className="fle-row flex gap-1 text-2xl font-bold">
            <BugIcon className="h-8" />
            {t("error.page.title")}
          </CardTitle>
          <CardDescription>{t("error.page.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="max-w-2xl truncate text-red-500">{error.message}</p>
        </CardContent>
        <CardFooter className="flex flex-row gap-2">
          <Button
            className="w-fit"
            onClick={() =>
              runAsync(async () => {
                if (isTauri()) {
                  await emit("kill-integrated-server", {});
                }
                logOut();
                await navigate({
                  to: "/",
                  replace: true,
                });
              })
            }
          >
            <LogOutIcon />
            {t("error.page.logOut")}
          </Button>
          <Button onClick={revalidate}>
            {revalidating ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <RotateCwIcon />
            )}
            {t("error.page.reloadPage")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
