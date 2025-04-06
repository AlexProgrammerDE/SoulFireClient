import {
  BoolSetting,
  ComboSetting,
  DoubleSetting,
  IntSetting,
  MinMaxSetting,
  MinMaxSetting_Entry,
  SettingEntry,
  SettingsPage,
  StringListSetting,
  StringSetting,
  StringSetting_InputType,
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
import { Check, ChevronsUpDown, PlusIcon, TrashIcon } from 'lucide-react';
import {
  cn,
  getEntryValueByType,
  setInstanceConfig,
  setServerConfig,
  updateEntry,
} from '@/lib/utils.tsx';
import {
  HTMLInputTypeAttribute,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Input } from '@/components/ui/input.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { BaseSettings } from '@/lib/types.ts';
import { JsonValue } from '@protobuf-ts/runtime';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useTranslation } from 'react-i18next';
import { NumericFormat } from 'react-number-format';
import { useLocaleNumberFormat } from '@/hooks/use-locale-number-format.tsx';
import { toast } from 'sonner';
import { TFunction } from 'i18next';
import { NumberFormatValues } from 'react-number-format/types/types';
import { useRouteContext } from '@tanstack/react-router';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { TextInfoButton } from '@/components/info-buttons.tsx';

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
  title: ReactNode;
  description: ReactNode;
  onClick?: () => void;
}) {
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
      <TextInfoButton value={props.description} />
    </div>
  );
}

function inputTypeToHtml(
  inputType: StringSetting_InputType,
): HTMLInputTypeAttribute {
  switch (inputType) {
    case StringSetting_InputType.TEXT:
      return 'text';
    case StringSetting_InputType.PASSWORD:
      return 'password';
    case StringSetting_InputType.TEXTAREA:
      throw new Error('Cannot convert textarea to HTML input type');
    case StringSetting_InputType.EMAIL:
      return 'email';
    case StringSetting_InputType.URL:
      return 'url';
    case StringSetting_InputType.SEARCH:
      return 'search';
    case StringSetting_InputType.TEL:
      return 'tel';
  }
}

function StringComponent(props: {
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

  if (props.setting.inputType === StringSetting_InputType.TEXTAREA) {
    return (
      <Textarea
        value={inputValue}
        placeholder={props.setting.placeholder}
        minLength={props.setting.minLength}
        maxLength={props.setting.maxLength}
        disabled={props.setting.disabled}
        onChange={(e) => {
          props.changeCallback(e.currentTarget.value);
        }}
      />
    );
  } else {
    return (
      <Input
        value={inputValue}
        type={inputTypeToHtml(props.setting.inputType)}
        placeholder={props.setting.placeholder}
        minLength={props.setting.minLength}
        maxLength={props.setting.maxLength}
        pattern={props.setting.pattern}
        disabled={props.setting.disabled}
        onChange={(e) => {
          props.changeCallback(e.currentTarget.value);
        }}
      />
    );
  }
}

function IntComponent(props: {
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
      disabled={props.setting.disabled}
      customInput={Input}
    />
  );
}

function DoubleComponent(props: {
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
      disabled={props.setting.disabled}
      customInput={Input}
    />
  );
}

function BoolComponent(props: {
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
        disabled={props.setting.disabled}
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
        onClick={
          props.setting.disabled
            ? undefined
            : () => {
                props.changeCallback(!props.value);
              }
        }
      />
    </>
  );
}

function ComboComponent(props: {
  setting: ComboSetting;
  value: string;
  changeCallback: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedOption = props.setting.options.find(
    (option) => option.id === props.value,
  );
  if (!selectedOption) {
    throw new Error('Selected option not found');
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-64 justify-between"
          disabled={props.setting.disabled}
        >
          <div className="inline-flex flex-row items-center justify-center gap-2">
            {selectedOption.iconId && (
              <DynamicIcon name={selectedOption.iconId} />
            )}
            <span className="truncate">{selectedOption.displayName}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search value..." />
          <CommandList>
            <CommandGroup>
              {props.setting.options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  keywords={[option.displayName, ...option.keywords]}
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
                  {option.iconId && <DynamicIcon name={option.iconId} />}
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

function StringListComponent(props: {
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
            disabled={props.setting.disabled}
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
            disabled={props.setting.disabled}
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
              disabled={props.setting.disabled}
            />
            <Button
              variant="outline"
              onClick={() => {
                deleteId(item.id);
              }}
              disabled={props.setting.disabled}
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

function MinMaxComponent(props: {
  setting: MinMaxSetting;
  entry: MinMaxSetting_Entry;
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
      disabled={props.setting.disabled}
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

  return (
    <GenericEntryComponent
      entry={props.entry.value}
      value={value}
      changeCallback={setValueMutation.mutate}
    />
  );
}

export function GenericEntryComponent(props: {
  entry: SettingEntry['value'];
  value: JsonValue;
  changeCallback: (value: JsonValue) => void;
}) {
  if (!props.entry || props.value === undefined) {
    return null;
  }

  switch (props.entry.oneofKind) {
    case 'string': {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.entry.string.uiName}
            description={props.entry.string.description}
          />
          <StringComponent
            setting={props.entry.string}
            value={props.value as string}
            changeCallback={props.changeCallback}
          />
        </div>
      );
    }
    case 'int': {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.entry.int.uiName}
            description={props.entry.int.description}
          />
          <IntComponent
            setting={props.entry.int}
            value={props.value as number}
            changeCallback={props.changeCallback}
          />
        </div>
      );
    }
    case 'bool': {
      return (
        <div className="flex max-w-xl flex-row gap-1">
          <BoolComponent
            setting={props.entry.bool}
            value={props.value as boolean}
            changeCallback={props.changeCallback}
            title={props.entry.bool.uiName}
            description={props.entry.bool.description}
          />
        </div>
      );
    }
    case 'double': {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.entry.double.uiName}
            description={props.entry.double.description}
          />
          <DoubleComponent
            setting={props.entry.double}
            value={props.value as number}
            changeCallback={props.changeCallback}
          />
        </div>
      );
    }
    case 'combo': {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.entry.combo.uiName}
            description={props.entry.combo.description}
          />
          <ComboComponent
            setting={props.entry.combo}
            value={props.value as string}
            changeCallback={props.changeCallback}
          />
        </div>
      );
    }
    case 'stringList': {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.entry.stringList.uiName}
            description={props.entry.stringList.description}
          />
          <StringListComponent
            setting={props.entry.stringList}
            value={props.value as string[]}
            changeCallback={props.changeCallback}
          />
        </div>
      );
    }
    case 'minMax': {
      const castValue = props.value as {
        min: number;
        max: number;
      };
      return (
        <>
          <div className="flex max-w-xl flex-col gap-1">
            <ComponentTitle
              title={props.entry.minMax.minEntry!.uiName}
              description={props.entry.minMax.minEntry!.description}
            />
            <MinMaxComponent
              setting={props.entry.minMax}
              entry={props.entry.minMax.minEntry!}
              value={castValue.min}
              changeCallback={(v) => {
                props.changeCallback({
                  max: Math.max(castValue.max, v),
                  min: v,
                });
              }}
            />
          </div>
          <div className="flex max-w-xl flex-col gap-1">
            <ComponentTitle
              title={props.entry.minMax.maxEntry!.uiName}
              description={props.entry.minMax.maxEntry!.description}
            />
            <MinMaxComponent
              setting={props.entry.minMax}
              entry={props.entry.minMax.maxEntry!}
              value={castValue.max}
              changeCallback={(v) => {
                props.changeCallback({
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
  const instanceInfoQueryOptions = useRouteContext({
    from: '/_dashboard/instance/$instance',
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const transport = useContext(TransportContext);
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
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
  const serverInfoQueryOptions = useRouteContext({
    from: '/_dashboard/user/admin',
    select: (context) => context.serverInfoQueryOptions,
  });
  const { data: serverConfig } = useSuspenseQuery({
    ...serverInfoQueryOptions,
    select: (info) => info.parsedConfig,
  });
  const transport = useContext(TransportContext);
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
