import {
  BoolSetting,
  ComboSetting,
  DoubleSetting,
  IntSetting,
  MinMaxSetting,
  MinMaxSettingEntry,
  SettingEntry,
  SettingsPage,
  StringListSetting,
  StringSetting,
} from '@/generated/soulfire/common.ts';
import { Button } from '@/components/ui/button.tsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command.tsx';
import {
  Check,
  ChevronsUpDown,
  InfoIcon,
  PlusIcon,
  TrashIcon,
} from 'lucide-react';
import {
  cn,
  getEntryValueByType,
  setInstanceConfig,
  setServerConfig,
  updateEntry,
} from '@/lib/utils.tsx';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { BaseSettings } from '@/lib/types.ts';
import { JsonValue } from '@protobuf-ts/runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { ServerConfigContext } from '@/components/providers/server-config-context.tsx';
import { useTranslation } from 'react-i18next';
import { NumericFormat } from 'react-number-format';
import { useLocaleNumberFormat } from '@/hooks/use-locale-number-format.tsx';
import { toast } from 'sonner';
import { TFunction } from 'i18next';
import { NumberFormatValues } from 'react-number-format/types/types';
import { useRouteContext } from '@tanstack/react-router';

function isAllowedValidator(
  t: TFunction,
  min: number,
  max: number,
  parseFunc: (value: string) => number,
) {
  return (values: NumberFormatValues) => {
    const currentValue = parseFunc(values.value);

    if (!Number.isFinite(currentValue)) {
      return false;
    }

    if (currentValue >= min && currentValue <= max) {
      return true;
    } else {
      toast.warning(t('settingsPage.invalidNumberToast.title'), {
        id: 'invalid-number',
        description: t('settingsPage.invalidNumberToast.title', {
          min,
          max,
        }),
      });
      return false;
    }
  };
}

export function ComponentTitle(props: {
  title: string;
  description: string;
  onClick?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-fit flex-row items-center gap-2">
      <p
        onClick={props.onClick}
        className={cn({
          'cursor-pointer': props.onClick !== undefined,
        })}
      >
        {props.title}
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <InfoIcon
            className="h-4 w-4 shrink-0 cursor-pointer opacity-50"
            onClick={() => {
              setOpen(!open);
            }}
          />
        </PopoverTrigger>
        <PopoverContent>
          <p className="whitespace-pre-line">{props.description}</p>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function StringComponent(props: {
  setting: StringSetting;
  value: string;
  changeCallback: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState(props.value);

  useEffect(() => {
    setInputValue((old) => {
      if (old !== props.value) {
        return props.value;
      }

      return old;
    });
  }, [props.value]);

  if (props.setting.textarea) {
    return (
      <Textarea
        value={inputValue}
        placeholder={props.setting.placeholder}
        onChange={(e) => {
          props.changeCallback(e.currentTarget.value);
        }}
      />
    );
  } else {
    return (
      <Input
        value={inputValue}
        placeholder={props.setting.placeholder}
        type={props.setting.secret ? 'password' : 'text'}
        onChange={(e) => {
          props.changeCallback(e.currentTarget.value);
        }}
      />
    );
  }
}

export function IntComponent(props: {
  setting: IntSetting;
  value: number;
  changeCallback: (value: number) => void;
}) {
  const { t } = useTranslation('common');
  const localeNumberFormat = useLocaleNumberFormat();
  const [inputValue, setInputValue] = useState(props.value);

  useEffect(() => {
    setInputValue((old) => {
      if (old !== props.value) {
        return props.value;
      }

      return old;
    });
  }, [props.value]);

  return (
    <NumericFormat
      value={inputValue}
      thousandSeparator={
        props.setting.thousandSeparator
          ? localeNumberFormat.thousandSeparator
          : undefined
      }
      decimalSeparator={localeNumberFormat.decimalSeparator}
      allowNegative={props.setting.min < 0}
      decimalScale={0}
      isAllowed={isAllowedValidator(
        t,
        props.setting.min,
        props.setting.max,
        parseInt,
      )}
      onValueChange={(values) => {
        const currentValue = parseInt(values.value);

        if (!Number.isFinite(currentValue)) {
          return;
        }

        props.changeCallback(currentValue);
      }}
      placeholder={props.setting.placeholder}
      inputMode="numeric"
      min={props.setting.min}
      max={props.setting.max}
      step={props.setting.step}
      customInput={Input}
    />
  );
}

export function DoubleComponent(props: {
  setting: DoubleSetting;
  value: number;
  changeCallback: (value: number) => void;
}) {
  const { t } = useTranslation('common');
  const localeNumberFormat = useLocaleNumberFormat();
  const [inputValue, setInputValue] = useState(props.value);

  useEffect(() => {
    setInputValue((old) => {
      if (old !== props.value) {
        return props.value;
      }

      return old;
    });
  }, [props.value]);

  return (
    <NumericFormat
      value={inputValue}
      thousandSeparator={
        props.setting.thousandSeparator
          ? localeNumberFormat.thousandSeparator
          : undefined
      }
      decimalSeparator={localeNumberFormat.decimalSeparator}
      allowNegative={props.setting.min < 0}
      decimalScale={props.setting.decimalScale}
      fixedDecimalScale={props.setting.fixedDecimalScale}
      isAllowed={isAllowedValidator(
        t,
        props.setting.min,
        props.setting.max,
        parseFloat,
      )}
      onValueChange={(values) => {
        const currentValue = parseFloat(values.value);

        if (!Number.isFinite(currentValue)) {
          return;
        }

        props.changeCallback(currentValue);
      }}
      placeholder={props.setting.placeholder}
      inputMode="decimal"
      min={props.setting.min}
      max={props.setting.max}
      step={props.setting.step}
      customInput={Input}
    />
  );
}

export function BoolComponent(props: {
  setting: BoolSetting;
  value: boolean;
  changeCallback: (value: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <>
      <Checkbox
        className="my-auto"
        checked={props.value}
        onCheckedChange={(value) => {
          if (value === 'indeterminate') {
            return;
          }

          props.changeCallback(value);
        }}
      />
      <ComponentTitle
        title={props.title}
        description={props.description}
        onClick={() => {
          props.changeCallback(!props.value);
        }}
      />
    </>
  );
}

export function ComboComponent(props: {
  setting: ComboSetting;
  value: string;
  changeCallback: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {
            props.setting.options.find((option) => option.id === props.value)
              ?.displayName
          }
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search value..." />
          <CommandList>
            <CommandGroup>
              {props.setting.options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={(currentValue) => {
                    props.changeCallback(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      props.value === option.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.displayName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type IdValue<T> = { id: string; value: T };

function makeIdValueArray<T>(values: T[]): IdValue<T>[] {
  return values.map((value) => makeIdValueSingle(value));
}

function makeIdValueSingle<T>(value: T): IdValue<T> {
  const randomId = Math.random().toString(36).substring(7);
  return { id: randomId, value };
}

export function StringListComponent(props: {
  setting: StringListSetting;
  value: string[];
  changeCallback: (value: string[]) => void;
}) {
  const { t } = useTranslation('common');
  const idValueArray = useMemo(
    () => makeIdValueArray(props.value),
    [props.value],
  );
  const [newEntryInput, setNewEntryInput] = useState('');

  const insertValue = (newValue: string) => {
    const resultArray = [...idValueArray, makeIdValueSingle(newValue)];
    props.changeCallback(resultArray.map((i) => i.value));
  };
  const updateId = (id: string, newValue: string) => {
    const resultArray = [...idValueArray];
    const index = resultArray.findIndex((item) => item.id === id);
    resultArray[index] = { id, value: newValue };
    props.changeCallback(resultArray.map((i) => i.value));
  };
  const deleteId = (id: string) => {
    const resultArray = [...idValueArray];
    const index = resultArray.findIndex((item) => item.id === id);
    resultArray.splice(index, 1);
    props.changeCallback(resultArray.map((i) => i.value));
  };

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex flex-row gap-1">
          <Input
            type="text"
            value={newEntryInput}
            onChange={(e) => {
              setNewEntryInput(e.currentTarget.value);
            }}
            placeholder={t('settingsPage.stringList.placeholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                insertValue(newEntryInput);
                setNewEntryInput('');
              }
            }}
          />
          <Button
            variant="outline"
            onClick={() => {
              insertValue(newEntryInput);
              setNewEntryInput('');
            }}
          >
            <PlusIcon className="h-4 w-4" />
            {t('settingsPage.stringList.add')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 p-4 pt-0">
        {idValueArray.map((item) => (
          <div key={item.id} className="flex flex-row gap-1">
            <Input
              type="text"
              defaultValue={item.value}
              onChange={(e) => {
                updateId(item.id, e.currentTarget.value);
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                deleteId(item.id);
              }}
            >
              <TrashIcon className="h-4 w-4" />
              {t('settingsPage.stringList.remove')}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MinMaxComponent(props: {
  setting: MinMaxSetting;
  entry: MinMaxSettingEntry;
  value: number;
  changeCallback: (value: number) => void;
}) {
  const { t } = useTranslation('common');
  const localeNumberFormat = useLocaleNumberFormat();
  const [inputValue, setInputValue] = useState(props.value);

  useEffect(() => {
    setInputValue((old) => {
      if (old !== props.value) {
        return props.value;
      }

      return old;
    });
  }, [props.value]);

  return (
    <NumericFormat
      value={inputValue}
      thousandSeparator={
        props.setting.thousandSeparator
          ? localeNumberFormat.thousandSeparator
          : undefined
      }
      decimalSeparator={localeNumberFormat.decimalSeparator}
      allowNegative={props.setting.min < 0}
      decimalScale={0}
      isAllowed={isAllowedValidator(
        t,
        props.setting.min,
        props.setting.max,
        parseInt,
      )}
      onValueChange={(values) => {
        const currentValue = parseInt(values.value);

        if (!Number.isFinite(currentValue)) {
          return;
        }

        props.changeCallback(currentValue);
      }}
      placeholder={props.entry.placeholder}
      inputMode="numeric"
      min={props.setting.min}
      max={props.setting.max}
      step={props.setting.step}
      customInput={Input}
    />
  );
}

function EntryComponent<T extends BaseSettings>(props: {
  namespace: string;
  entry: SettingEntry;
  invalidateQuery: () => Promise<void>;
  setConfig: (config: T) => Promise<void>;
  config: T;
}) {
  const value = useMemo(
    () => getEntryValueByType(props.namespace, props.config, props.entry),
    [props.config, props.entry, props.namespace],
  );
  const setValueMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      await props.setConfig(
        updateEntry(props.namespace, props.entry.key, value, props.config),
      );
    },
    onSettled: async () => {
      await props.invalidateQuery();
    },
  });

  if (!props.entry || value === undefined) {
    return null;
  }

  switch (props.entry.value.oneofKind) {
    case 'string': {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.entry.value.string.uiName}
            description={props.entry.value.string.description}
          />
          <StringComponent
            setting={props.entry.value.string}
            value={value as string}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'int': {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.entry.value.int.uiName}
            description={props.entry.value.int.description}
          />
          <IntComponent
            setting={props.entry.value.int}
            value={value as number}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'bool': {
      return (
        <div className="flex max-w-xl flex-row gap-1">
          <BoolComponent
            setting={props.entry.value.bool}
            value={value as boolean}
            changeCallback={setValueMutation.mutate}
            title={props.entry.value.bool.uiName}
            description={props.entry.value.bool.description}
          />
        </div>
      );
    }
    case 'double': {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.entry.value.double.uiName}
            description={props.entry.value.double.description}
          />
          <DoubleComponent
            setting={props.entry.value.double}
            value={value as number}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'combo': {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.entry.value.combo.uiName}
            description={props.entry.value.combo.description}
          />
          <ComboComponent
            setting={props.entry.value.combo}
            value={value as string}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'stringList': {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.entry.value.stringList.uiName}
            description={props.entry.value.stringList.description}
          />
          <StringListComponent
            setting={props.entry.value.stringList}
            value={value as string[]}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'minMax': {
      const castValue = value as {
        min: number;
        max: number;
      };
      return (
        <>
          <div className="flex max-w-xl flex-col gap-1">
            <ComponentTitle
              title={props.entry.value.minMax.minEntry!.uiName}
              description={props.entry.value.minMax.minEntry!.description}
            />
            <MinMaxComponent
              setting={props.entry.value.minMax}
              entry={props.entry.value.minMax.minEntry!}
              value={castValue.min}
              changeCallback={(v) => {
                setValueMutation.mutate({
                  max: Math.max(castValue.max, v),
                  min: v,
                });
              }}
            />
          </div>
          <div className="flex max-w-xl flex-col gap-1">
            <ComponentTitle
              title={props.entry.value.minMax.maxEntry!.uiName}
              description={props.entry.value.minMax.maxEntry!.description}
            />
            <MinMaxComponent
              setting={props.entry.value.minMax}
              entry={props.entry.value.minMax.maxEntry!}
              value={castValue.max}
              changeCallback={(v) => {
                setValueMutation.mutate({
                  max: v,
                  min: Math.min(castValue.min, v),
                });
              }}
            />
          </div>
        </>
      );
    }
  }
}

function ClientSettingsPageComponent<T extends BaseSettings>({
  data,
  invalidateQuery,
  setConfig,
  config,
}: {
  data: SettingsPage;
  invalidateQuery: () => Promise<void>;
  setConfig: (config: T) => Promise<void>;
  config: T;
}) {
  return (
    <>
      {data.entries
        .filter((entry) => entry.key !== data.enabledKey)
        .map((page) => (
          <EntryComponent
            namespace={data.namespace}
            key={page.key}
            entry={page}
            setConfig={setConfig}
            invalidateQuery={invalidateQuery}
            config={config}
          />
        ))}
    </>
  );
}

export function InstanceSettingsPageComponent({
  data,
}: {
  data: SettingsPage;
}) {
  const queryClient = useQueryClient();
  const instanceInfo = useContext(InstanceInfoContext);
  const transport = useContext(TransportContext);
  const profile = useContext(ProfileContext);
  const instanceInfoQueryOptions = useRouteContext({
    from: '/dashboard/instance/$instance',
    select: (context) => context.instanceInfoQueryOptions,
  });
  return (
    <ClientSettingsPageComponent
      data={data}
      setConfig={async (jsonProfile) =>
        await setInstanceConfig(
          jsonProfile,
          instanceInfo,
          transport,
          queryClient,
          instanceInfoQueryOptions.queryKey,
        )
      }
      invalidateQuery={async () => {
        await queryClient.invalidateQueries({
          queryKey: instanceInfoQueryOptions.queryKey,
        });
      }}
      config={profile}
    />
  );
}

export function AdminSettingsPageComponent({ data }: { data: SettingsPage }) {
  const queryClient = useQueryClient();
  const serverConfig = useContext(ServerConfigContext);
  const transport = useContext(TransportContext);
  const serverInfoQueryOptions = useRouteContext({
    from: '/dashboard/user/admin',
    select: (context) => context.serverInfoQueryOptions,
  });
  return (
    <ClientSettingsPageComponent
      data={data}
      setConfig={async (jsonProfile) =>
        await setServerConfig(
          jsonProfile,
          transport,
          queryClient,
          serverInfoQueryOptions.queryKey,
        )
      }
      invalidateQuery={async () => {
        await queryClient.invalidateQueries({
          queryKey: serverInfoQueryOptions.queryKey,
        });
      }}
      config={serverConfig}
    />
  );
}
