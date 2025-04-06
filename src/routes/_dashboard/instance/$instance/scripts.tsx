import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createTransport } from '@/lib/web-rpc.ts';
import { queryClientInstance } from '@/lib/query.ts';
import { ScriptListResponse } from '@/generated/soulfire/script.ts';
import { ScriptServiceClient } from '@/generated/soulfire/script.client.ts';
import { GenericScripts } from '@/components/generic-scripts-page.tsx';
import InstancePageLayout from '@/components/nav/instance-page-layout';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_dashboard/instance/$instance/scripts')({
  beforeLoad: (props) => {
    const { instance } = props.params;
    const instanceScriptsQueryOptions = queryOptions({
      queryKey: ['instance-scripts', instance],
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
                oneofKind: 'instanceScript',
                instanceScript: {
                  id: instance,
                },
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
    props.abortController.signal.addEventListener('abort', () => {
      void queryClientInstance.cancelQueries({
        queryKey: instanceScriptsQueryOptions.queryKey,
      });
    });
    return {
      instanceScriptsQueryOptions,
    };
  },
  loader: (props) => {
    void queryClientInstance.prefetchQuery(
      props.context.instanceScriptsQueryOptions,
    );
  },
  component: InstanceScripts,
});

function InstanceScripts() {
  const { t } = useTranslation('common');
  const { instanceScriptsQueryOptions } = Route.useRouteContext();
  const { instance } = Route.useParams();
  const { data: scriptList } = useSuspenseQuery(instanceScriptsQueryOptions);

  return (
    <InstancePageLayout
      extraCrumbs={[t('breadcrumbs.settings')]}
      pageName={t('pageName.instanceScripts')}
    >
      <GenericScripts
        queryKey={instanceScriptsQueryOptions.queryKey}
        scope={{
          scope: {
            oneofKind: 'instanceScript',
            instanceScript: {
              id: instance,
            },
          },
        }}
        scriptList={scriptList}
      />
    </InstancePageLayout>
  );
}
