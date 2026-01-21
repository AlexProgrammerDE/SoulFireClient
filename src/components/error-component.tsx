import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { emit } from "@tauri-apps/api/event";
import {
  BugIcon,
  ChevronDownIcon,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible.tsx";
import { isTauri, runAsync } from "@/lib/utils.tsx";
import { logOut } from "@/lib/web-rpc.ts";

export function ErrorComponent({ error }: { error: Error }) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();
  const [revalidating, setRevalidating] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  const hasStack = error.stack && error.stack !== error.message;

  return (
    <div className="flex size-full grow">
      <Card className="m-auto flex max-w-2xl flex-col">
        <CardHeader>
          <CardTitle className="fle-row flex gap-1 text-2xl font-bold">
            <BugIcon className="h-8" />
            {t("error.page.title")}
          </CardTitle>
          <CardDescription>{t("error.page.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <div className="flex flex-col gap-2">
              <p className="select-text break-words text-red-500">
                {error.message}
              </p>
              {hasStack && (
                <>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-fit gap-1 px-2"
                    >
                      <ChevronDownIcon
                        className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                      {t("error.page.showDetails")}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="max-h-64 select-text overflow-auto rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
                      {error.stack}
                    </pre>
                  </CollapsibleContent>
                </>
              )}
            </div>
          </Collapsible>
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
