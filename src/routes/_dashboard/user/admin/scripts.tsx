import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { GenericScripts } from "@/components/generic-scripts-page.tsx";
import UserPageLayout from "@/components/nav/user/user-page-layout";
import { ScriptServiceClient } from "@/generated/soulfire/script.client.ts";
import type { ScriptListResponse } from "@/generated/soulfire/script.ts";
import { createTransport } from "@/lib/web-rpc.ts";

export const Route = createFileRoute("/_dashboard/user/admin/scripts")({
  beforeLoad: (props) => {
    const globalScriptsQueryOptions = queryOptions({
      queryKey: ["global-scripts"],
      queryFn: async (props): Promise<ScriptListResponse> => {
        const transport = createTransport();
        if (transport === null) {
          return {
            scripts: [],
          };
        }

        const scriptService = new ScriptServiceClient(transport);
        const result = await scriptService.listScripts(
          {
            scope: {
              scope: {
                oneofKind: "globalScript",
                globalScript: {},
              },
            },
          },
          {
            abort: props.signal,
          },
        );

        return result.response;
      },
      refetchInterval: 3_000,
    });
    props.abortController.signal.addEventListener("abort", () => {
      void props.context.queryClient.cancelQueries({
        queryKey: globalScriptsQueryOptions.queryKey,
      });
    });
    return {
      globalScriptsQueryOptions,
    };
  },
  loader: (props) => {
    void props.context.queryClient.prefetchQuery(
      props.context.globalScriptsQueryOptions,
    );
  },
  component: AdminScripts,
});

function AdminScripts() {
  const { t } = useTranslation("common");

  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={[
        {
          id: "settings",
          content: t("breadcrumbs.settings"),
        },
      ]}
      pageName={t("pageName.adminScripts")}
    >
      <Content />
    </UserPageLayout>
  );
}

function Content() {
  const { globalScriptsQueryOptions } = Route.useRouteContext();
  const { data: scriptList } = useSuspenseQuery(globalScriptsQueryOptions);
  return (
    <GenericScripts
      queryKey={globalScriptsQueryOptions.queryKey}
      scope={{
        scope: {
          oneofKind: "globalScript",
          globalScript: {},
        },
      }}
      scriptList={scriptList}
    />
  );
}
