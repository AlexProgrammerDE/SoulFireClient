import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { ServerPlugin, SettingsPage } from '@/generated/soulfire/config.ts';
import { useTranslation } from 'react-i18next';

export function PluginInfoCard(props: {
  pluginInfo: ServerPlugin;
  settingsEntry: SettingsPage;
}) {
  const { t } = useTranslation('common');
  return (
    <Card className="max-w-4xl">
      <CardHeader className="p-4">
        <CardTitle className="text-xl">
          {props.settingsEntry.pageName}
        </CardTitle>
        <CardDescription className="whitespace-pre-line">
          {props.pluginInfo.description}
        </CardDescription>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">
            {t('pluginCard.version', {
              version: props.pluginInfo.version,
            })}
          </Badge>
          <Badge variant="secondary">
            {t('pluginCard.author', {
              author: props.pluginInfo.author,
            })}
          </Badge>
          <Badge variant="secondary">
            {t('pluginCard.license', {
              license: props.pluginInfo.license,
            })}
          </Badge>
          <a
            href={props.pluginInfo.website}
            className="inline-flex items-center"
            target="_blank"
          >
            <Badge variant="secondary">
              {t('pluginCard.website', {
                website: props.pluginInfo.website,
              })}
            </Badge>
          </a>
        </div>
      </CardHeader>
    </Card>
  );
}
