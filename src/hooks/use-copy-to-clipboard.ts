import * as clipboard from "@tauri-apps/plugin-clipboard-manager";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { isTauri } from "@/lib/utils.tsx";

function copyToClipboard(text: string): Promise<void> {
  if (isTauri()) {
    return clipboard.writeText(text);
  } else {
    return navigator.clipboard.writeText(text);
  }
}

export function useCopyToClipboard() {
  const { t } = useTranslation("common");

  return useCallback<(text: string) => void>(
    (text) => {
      toast.promise(copyToClipboard(text), {
        loading: t("clipboardCopy.loading"),
        success: t("clipboardCopy.success"),
        error: t("clipboardCopy.error"),
      });
    },
    [t],
  );
}
