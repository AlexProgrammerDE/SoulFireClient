import {
  BoolSetting,
  ComboSetting,
  DoubleSetting,
  IntSetting,
  MinMaxSetting,
  MinMaxSettingEntry,
  SettingsPage,
  SettingType,
  StringListSetting,
  StringSetting,
} from '@/generated/soulfire/config.ts';
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
  invalidateInstanceQuery,
  invalidateServerQuery,
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

function ComponentTitle(props: {
  title: string;
  description: string;
  onClick?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-row gap-2 w-fit items-center">
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
            className="h-4 w-4 shrink-0 opacity-50 cursor-pointer"
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

function StringComponent(props: {
  entry: StringSetting;
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

  if (props.entry.textarea) {
    return (
      <Textarea
        value={inputValue}
        placeholder={props.entry.placeholder}
        defaultValue={props.value}
        onChange={(e) => {
          props.changeCallback(e.currentTarget.value);
        }}
      />
    );
  } else {
    return (
      <Input
        value={inputValue}
        placeholder={props.entry.placeholder}
        type={props.entry.secret ? 'password' : 'text'}
        defaultValue={props.value}
        onChange={(e) => {
          props.changeCallback(e.currentTarget.value);
        }}
      />
    );
  }
}

function IntComponent(props: {
  entry: IntSetting;
  value: number;
  changeCallback: (value: number) => void;
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

  return (
    <NumericFormat
      value={inputValue}
      thousandSeparator={props.entry.thousandSeparator}
      allowNegative={props.entry.min < 0}
      decimalScale={0}
      onValueChange={(values) => {
        const currentValue = parseInt(values.value);

        if (!Number.isFinite(currentValue)) {
          return;
        }

        props.changeCallback(currentValue);
      }}
      placeholder={props.entry.placeholder}
      inputMode="numeric"
      min={props.entry.min}
      max={props.entry.max}
      step={props.entry.step}
      defaultValue={props.value}
      customInput={Input}
    />
  );
}

function DoubleComponent(props: {
  entry: DoubleSetting;
  value: number;
  changeCallback: (value: number) => void;
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

  return (
    <NumericFormat
      value={inputValue}
      thousandSeparator={props.entry.thousandSeparator}
      allowNegative={props.entry.min < 0}
      decimalScale={props.entry.decimalScale}
      fixedDecimalScale={props.entry.fixedDecimalScale}
      onValueChange={(values) => {
        const currentValue = parseFloat(values.value);

        if (!Number.isFinite(currentValue)) {
          return;
        }

        props.changeCallback(currentValue);
      }}
      placeholder={props.entry.placeholder}
      inputMode="decimal"
      min={props.entry.min}
      max={props.entry.max}
      step={props.entry.step}
      defaultValue={props.value}
      customInput={Input}
    />
  );
}

function BoolComponent(props: {
  entry: BoolSetting;
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

function ComboComponent(props: {
  entry: ComboSetting;
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
            props.entry.options.find((option) => option.id === props.value)
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
              {props.entry.options.map((option) => (
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

function StringListComponent(props: {
  entry: StringListSetting;
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

function MinMaxComponent(props: {
  setting: MinMaxSetting;
  entry: MinMaxSettingEntry;
  value: number;
  changeCallback: (value: number) => void;
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

  return (
    <NumericFormat
      value={inputValue}
      thousandSeparator={props.setting.thousandSeparator}
      allowNegative={props.setting.min < 0}
      decimalScale={0}
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
      defaultValue={props.value}
      customInput={Input}
    />
  );
}

type MinMaxType = {
  min: number;
  max: number;
};

function EntryComponent<T extends BaseSettings>(props: {
  namespace: string;
  settingKey: string;
  entry: SettingType;
  invalidateQuery: () => Promise<void>;
  setConfig: (config: T) => Promise<void>;
  config: T;
}) {
  const value = useMemo(
    () =>
      getEntryValueByType(
        props.namespace,
        props.settingKey,
        props.config,
        props.entry,
      ),
    [props.config, props.entry, props.namespace, props.settingKey],
  );
  const setValueMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      await props.setConfig(
        updateEntry(props.namespace, props.settingKey, value, props.config),
      );
    },
    onSettled: () => {
      void props.invalidateQuery();
    },
  });

  if (!props.entry || value === undefined) {
    return null;
  }

  switch (props.entry.value.oneofKind) {
    case 'string': {
      return (
        <div className="flex flex-col gap-1 max-w-xl">
          <ComponentTitle
            title={props.entry.value.string.uiName}
            description={props.entry.value.string.description}
          />
          <StringComponent
            entry={props.entry.value.string}
            value={value as string}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'int': {
      return (
        <div className="flex flex-col gap-1 max-w-xl">
          <ComponentTitle
            title={props.entry.value.int.uiName}
            description={props.entry.value.int.description}
          />
          <IntComponent
            entry={props.entry.value.int}
            value={value as number}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'bool': {
      return (
        <div className="flex flex-row gap-1 max-w-xl">
          <BoolComponent
            entry={props.entry.value.bool}
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
        <div className="flex flex-col gap-1 max-w-xl">
          <ComponentTitle
            title={props.entry.value.double.uiName}
            description={props.entry.value.double.description}
          />
          <DoubleComponent
            entry={props.entry.value.double}
            value={value as number}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'combo': {
      return (
        <div className="flex flex-col gap-1 max-w-xl">
          <ComponentTitle
            title={props.entry.value.combo.uiName}
            description={props.entry.value.combo.description}
          />
          <ComboComponent
            entry={props.entry.value.combo}
            value={value as string}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'stringList': {
      return (
        <div className="flex flex-col gap-1 max-w-xl">
          <ComponentTitle
            title={props.entry.value.stringList.uiName}
            description={props.entry.value.stringList.description}
          />
          <StringListComponent
            entry={props.entry.value.stringList}
            value={value as string[]}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'minMax': {
      const castValue = value as MinMaxType;
      return (
        <>
          <div className="flex flex-col gap-1 max-w-xl">
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
                  max: castValue.max < v ? v : castValue.max,
                  min: v,
                });
              }}
            />
          </div>
          <div className="flex flex-col gap-1 max-w-xl">
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
                  min: castValue.min > v ? v : castValue.min,
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
        .map((page) => {
          return (
            <EntryComponent
              namespace={data.namespace}
              key={page.key}
              settingKey={page.key}
              entry={page.type!}
              setConfig={setConfig}
              invalidateQuery={invalidateQuery}
              config={config}
            />
          );
        })}
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
  return (
    <ClientSettingsPageComponent
      data={data}
      setConfig={async (jsonProfile) =>
        await setInstanceConfig(
          jsonProfile,
          instanceInfo,
          transport,
          queryClient,
        )
      }
      invalidateQuery={async () =>
        await invalidateInstanceQuery(instanceInfo, queryClient)
      }
      config={profile}
    />
  );
}

export function AdminSettingsPageComponent({ data }: { data: SettingsPage }) {
  const queryClient = useQueryClient();
  const serverConfig = useContext(ServerConfigContext);
  const transport = useContext(TransportContext);
  return (
    <ClientSettingsPageComponent
      data={data}
      setConfig={async (jsonProfile) =>
        await setServerConfig(jsonProfile, transport, queryClient)
      }
      invalidateQuery={async () => await invalidateServerQuery(queryClient)}
      config={serverConfig}
    />
  );
}
