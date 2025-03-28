import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { createTransport } from '@/lib/web-rpc.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { ScriptListResponse } from '@/generated/soulfire/script.ts';
import { ScriptServiceClient } from '@/generated/soulfire/script.client.ts';
import { GenericScripts } from '@/components/generic-scripts-page.tsx';
import { LoadingComponent } from '@/components/loading-component.tsx';
import { useTranslation } from 'react-i18next';
import UserPageLayout from '@/components/nav/user-page-layout';

export const Route = createFileRoute('/_dashboard/user/admin/scripts')({
  beforeLoad: (props) => {
    const globalScriptsQueryOptions = queryOptions({
      queryKey: ['global-scripts'],
      queryFn: async (
        props,
      ): Promise<{
        scriptList: ScriptListResponse;
      }> => {
        const transport = createTransport();
        if (transport === null) {
          return {
            scriptList: {
              scripts: [],
            },
          };
        }

        const scriptService = new ScriptServiceClient(transport);
        const result = await scriptService.listScripts(
          {
            scope: {
              scope: {
                oneofKind: 'globalScript',
                globalScript: {},
              },
            },
          },
          {
            abort: props.signal,
          },
        );

        return {
          scriptList: result.response,
        };
      },
      refetchInterval: 3_000,
    });
    props.abortController.signal.addEventListener('abort', () => {
      void queryClientInstance.cancelQueries({
        queryKey: globalScriptsQueryOptions.queryKey,
      });
    });
    return {
      globalScriptsQueryOptions,
    };
  },
  loader: async (props) => {
    await queryClientInstance.prefetchQuery(
      props.context.globalScriptsQueryOptions,
    );
  },
  component: AdminScripts,
});

function AdminScripts() {
  const { t } = useTranslation('common');
  const { globalScriptsQueryOptions } = Route.useRouteContext();
  const scriptList = useQuery(globalScriptsQueryOptions);

  if (scriptList.isError) {
    throw scriptList.error;
  }

  if (scriptList.isLoading || !scriptList.data) {
    return <LoadingComponent />;
  }

  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={[t('breadcrumbs.settings')]}
      pageName={t('pageName.adminScripts')}
    >
      <GenericScripts
        queryKey={globalScriptsQueryOptions.queryKey}
        scope={{
          scope: {
            oneofKind: 'globalScript',
            globalScript: {},
          },
        }}
        scriptList={scriptList.data.scriptList}
      />
    </UserPageLayout>
  );
}
