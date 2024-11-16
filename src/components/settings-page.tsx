import {
  BoolSetting,
  ComboSetting,
  DoubleSetting,
  IntSetting,
  MinMaxSetting,
  SettingsPage,
  SettingType,
  StringListSetting,
  StringSetting,
} from '@/generated/soulfire/config.ts';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
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
import { cn } from '@/lib/utils.ts';
import { useContext, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { convertToProto, ProfileRoot } from '@/lib/types.ts';
import { JsonValue } from '@protobuf-ts/runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { InstanceInfoResponse } from '@/generated/soulfire/instance.ts';
import { Textarea } from '@/components/ui/textarea.tsx';

function updateEntry(
  namespace: string,
  settingKey: string,
  value: JsonValue,
  profile: ProfileRoot,
): ProfileRoot {
  return {
    ...profile,
    settings: {
      ...profile.settings,
      [namespace]: {
        ...(profile.settings[namespace] || {}),
        [settingKey]: value,
      },
    },
  };
}

function getEntry(
  namespace: string,
  settingKey: string,
  profile: ProfileRoot,
  defaultValue: JsonValue,
): JsonValue {
  const current = profile.settings[namespace]?.[settingKey];
  if (current === undefined) {
    return defaultValue;
  }

  return current;
}

function ComponentTitle(props: { title: string; description: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="w-fit">{props.title}</TooltipTrigger>
      <TooltipContent>
        <p className="whitespace-pre-line">{props.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function StringComponent(props: {
  entry: StringSetting;
  value: string;
  changeCallback: (value: string) => void;
}) {
  if (props.entry.textarea) {
    return (
      <Textarea
        value={props.value}
        onChange={(e) => {
          props.changeCallback(e.currentTarget.value);
        }}
      />
    );
  } else {
    return (
      <Input
        type={props.entry.secret ? 'password' : 'text'}
        value={props.value as string}
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
  return (
    <Input
      type="number"
      inputMode="numeric"
      min={props.entry.min}
      max={props.entry.max}
      step={props.entry.step}
      value={props.value}
      onChange={(e) => {
        props.changeCallback(parseInt(e.currentTarget.value));
      }}
    />
  );
}

function DoubleComponent(props: {
  entry: DoubleSetting;
  value: number;
  changeCallback: (value: number) => void;
}) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      min={props.entry.min}
      max={props.entry.max}
      step={props.entry.step}
      value={props.value}
      onChange={(e) => {
        props.changeCallback(parseFloat(e.currentTarget.value));
      }}
    />
  );
}

function BoolComponent(props: {
  entry: BoolSetting;
  value: boolean;
  changeCallback: (value: boolean) => void;
}) {
  return (
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
            placeholder="Add new entry..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                insertValue(newEntryInput);
                setNewEntryInput('');
              }
            }}
          />
          <Button
            variant="outline"
            className="flex flex-row gap-1"
            onClick={() => {
              insertValue(newEntryInput);
              setNewEntryInput('');
            }}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add</span>
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
              className="flex flex-row gap-1"
              onClick={() => {
                deleteId(item.id);
              }}
            >
              <TrashIcon className="h-4 w-4" />
              <span>Remove</span>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MinMaxComponent(props: {
  entry: MinMaxSetting;
  value: number;
  changeCallback: (value: number) => void;
}) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      min={props.entry.min}
      max={props.entry.max}
      step={props.entry.step}
      value={props.value as number}
      onChange={(e) => {
        props.changeCallback(parseInt(e.currentTarget.value));
      }}
    />
  );
}

type MinMaxType = {
  min: number;
  max: number;
};

function EntryComponent(props: {
  namespace: string;
  settingKey: string;
  entry: SettingType;
}) {
  const queryClient = useQueryClient();
  const instanceInfo = useContext(InstanceInfoContext);
  const profile = useContext(ProfileContext);
  const transport = useContext(TransportContext);
  const instanceInfoQueryKey = ['instance-info', instanceInfo.id];
  const value = useMemo(() => {
    switch (props.entry.value.oneofKind) {
      case 'string': {
        return getEntry(
          props.namespace,
          props.settingKey,
          profile,
          props.entry.value.string.def,
        );
      }
      case 'int': {
        return getEntry(
          props.namespace,
          props.settingKey,
          profile,
          props.entry.value.int.def,
        );
      }
      case 'bool': {
        return getEntry(
          props.namespace,
          props.settingKey,
          profile,
          props.entry.value.bool.def,
        );
      }
      case 'double': {
        return getEntry(
          props.namespace,
          props.settingKey,
          profile,
          props.entry.value.double.def,
        );
      }
      case 'combo': {
        return getEntry(
          props.namespace,
          props.settingKey,
          profile,
          props.entry.value.combo.def,
        );
      }
      case 'stringList': {
        return getEntry(
          props.namespace,
          props.settingKey,
          profile,
          props.entry.value.stringList.def,
        );
      }
      case 'minMax': {
        return getEntry(props.namespace, props.settingKey, profile, {
          min: props.entry.value.minMax.minDef,
          max: props.entry.value.minMax.maxDef,
        });
      }
      case undefined: {
        return null;
      }
    }
  }, [profile, props.entry, props.namespace, props.settingKey]);
  const setValueMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      if (transport === null) {
        return;
      }

      const targetProfile = convertToProto(
        updateEntry(props.namespace, props.settingKey, value, profile),
      );
      await queryClient.cancelQueries({ queryKey: instanceInfoQueryKey });
      queryClient.setQueryData<{
        instanceInfo: InstanceInfoResponse;
      }>(instanceInfoQueryKey, (old) => {
        if (old === undefined) {
          return;
        }

        return {
          instanceInfo: {
            ...old.instanceInfo,
            config: targetProfile,
          },
        };
      });

      const instanceService = new InstanceServiceClient(transport);
      await instanceService.updateInstanceConfig({
        id: instanceInfo.id,
        config: targetProfile,
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: instanceInfoQueryKey,
      });
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
          />
          <ComponentTitle
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
              title={props.entry.value.minMax.minUiName}
              description={props.entry.value.minMax.minDescription}
            />
            <MinMaxComponent
              entry={props.entry.value.minMax}
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
              title={props.entry.value.minMax.maxUiName}
              description={props.entry.value.minMax.maxDescription}
            />
            <MinMaxComponent
              entry={props.entry.value.minMax}
              value={(value as MinMaxType).max}
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

export default function ClientSettingsPageComponent({
  data,
}: {
  data: SettingsPage;
}) {
  return (
    <>
      {data.entries.map((page) => {
        return (
          <EntryComponent
            namespace={data.namespace}
            key={page.key}
            settingKey={page.key}
            entry={page.type!}
          />
        );
      })}
    </>
  );
}
