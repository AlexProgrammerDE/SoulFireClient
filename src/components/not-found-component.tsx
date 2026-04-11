import { useNavigate, useRouter } from "@tanstack/react-router";
import { emit } from "@tauri-apps/api/event";
import {
  LoaderCircleIcon,
  LogOutIcon,
  RotateCwIcon,
  SearchXIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import { ButtonGroup } from "@/components/ui/button-group.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { isTauri, runAsync } from "@/lib/utils.tsx";
import { logOut } from "@/lib/web-rpc.ts";

export function NotFoundComponent() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const router = useRouter();
  const [revalidating, setRevalidating] = useState(false);

  return (
    <div className="flex size-full grow p-4">
      <Empty className="m-auto max-w-xl rounded-xl border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("notFound.page.title")}</EmptyTitle>
          <EmptyDescription>{t("notFound.page.description")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <ButtonGroup>
            <Button
              onClick={() => {
                runAsync(async () => {
                  if (isTauri()) {
                    await emit("kill-integrated-server", {});
                  }
                  logOut();
                  await navigate({
                    to: "/",
                    replace: true,
                  });
                });
              }}
            >
              <LogOutIcon />
              {t("notFound.page.logOut")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRevalidating(true);
                router
                  .invalidate()
                  .then(() => {
                    setRevalidating(false);
                  })
                  .catch(() => {
                    setRevalidating(false);
                  });
              }}
            >
              {revalidating ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <RotateCwIcon />
              )}
              {t("notFound.page.reloadPage")}
            </Button>
          </ButtonGroup>
        </EmptyContent>
      </Empty>
    </div>
  );
}
