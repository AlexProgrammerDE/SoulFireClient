import {
  BoolSetting,
  ComboSetting,
  DoubleSetting,
  IntSetting,
  SettingEntryMinMaxPair,
  SettingEntryMinMaxPairSingle,
  SettingEntrySingle,
  SettingsPage,
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
import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { convertToProto, ProfileRoot } from '@/lib/types.ts';
import { JsonValue } from '@protobuf-ts/runtime';
import { useDebouncedCallback } from 'use-debounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';

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
        <p>{props.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function StringComponent(props: {
  namespace: string;
  settingKey: string;
  entry: StringSetting;
  value: JsonValue;
  changeCallback: (value: JsonValue) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Input
      ref={ref}
      type={props.entry.secret ? 'password' : 'text'}
      value={props.value as string}
      onChange={(e) => {
        props.changeCallback(e.currentTarget.value);
      }}
    />
  );
}

function IntComponent(props: {
  namespace: string;
  settingKey: string;
  entry: IntSetting;
  value: JsonValue;
  changeCallback: (value: JsonValue) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Input
      ref={ref}
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

function DoubleComponent(props: {
  namespace: string;
  settingKey: string;
  entry: DoubleSetting;
  value: JsonValue;
  changeCallback: (value: JsonValue) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Input
      ref={ref}
      type="number"
      inputMode="decimal"
      min={props.entry.min}
      max={props.entry.max}
      step={props.entry.step}
      value={props.value as number}
      onChange={(e) => {
        props.changeCallback(parseFloat(e.currentTarget.value));
      }}
    />
  );
}

function BoolComponent(props: {
  namespace: string;
  settingKey: string;
  entry: BoolSetting;
  value: JsonValue;
  changeCallback: (value: JsonValue) => void;
}) {
  return (
    <Checkbox
      className="my-auto"
      checked={props.value as boolean}
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
  namespace: string;
  settingKey: string;
  entry: ComboSetting;
  value: JsonValue;
  changeCallback: (value: JsonValue) => void;
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
  namespace: string;
  settingKey: string;
  entry: StringListSetting;
  value: JsonValue;
  changeCallback: (value: JsonValue) => void;
}) {
  const castValue = props.value as string[];
  const idValueArray = useMemo(() => makeIdValueArray(castValue), [castValue]);
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

function SingleComponent(props: {
  namespace: string;
  settingKey: string;
  entry: SettingEntrySingle;
}) {
  const queryClient = useQueryClient();
  const instanceInfo = useContext(InstanceInfoContext);
  const profile = useContext(ProfileContext);
  const transport = useContext(TransportContext);
  const setValueMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      if (transport === null) {
        return;
      }

      const instanceService = new InstanceServiceClient(transport);
      await instanceService.updateInstanceConfig({
        id: instanceInfo.id,
        config: convertToProto(profile),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['instance-info', instanceInfo.id],
      });
    },
  });

  if (!props.entry.type) {
    return null;
  }

  switch (props.entry.type.value.oneofKind) {
    case 'string': {
      const value = getEntry(
        props.namespace,
        props.settingKey,
        profile,
        props.entry.type.value.string.def,
      );
      return (
        <div className="flex flex-col gap-1 max-w-xl">
          <ComponentTitle
            title={props.entry.uiName}
            description={props.entry.description}
          />
          <StringComponent
            namespace={props.namespace}
            settingKey={props.settingKey}
            entry={props.entry.type.value.string}
            value={value}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'int': {
      const value = getEntry(
        props.namespace,
        props.settingKey,
        profile,
        props.entry.type.value.int.def,
      );
      return (
        <div className="flex flex-col gap-1 max-w-xl">
          <ComponentTitle
            title={props.entry.uiName}
            description={props.entry.description}
          />
          <IntComponent
            namespace={props.namespace}
            settingKey={props.settingKey}
            entry={props.entry.type.value.int}
            value={value}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'bool': {
      const value = getEntry(
        props.namespace,
        props.settingKey,
        profile,
        props.entry.type.value.bool.def,
      );
      return (
        <div className="flex flex-row gap-1 max-w-xl">
          <BoolComponent
            namespace={props.namespace}
            settingKey={props.settingKey}
            entry={props.entry.type.value.bool}
            value={value}
            changeCallback={setValueMutation.mutate}
          />
          <ComponentTitle
            title={props.entry.uiName}
            description={props.entry.description}
          />
        </div>
      );
    }
    case 'double': {
      const value = getEntry(
        props.namespace,
        props.settingKey,
        profile,
        props.entry.type.value.double.def,
      );
      return (
        <div className="flex flex-col gap-1 max-w-xl">
          <ComponentTitle
            title={props.entry.uiName}
            description={props.entry.description}
          />
          <DoubleComponent
            namespace={props.namespace}
            settingKey={props.settingKey}
            entry={props.entry.type.value.double}
            value={value}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'combo': {
      const value = getEntry(
        props.namespace,
        props.settingKey,
        profile,
        props.entry.type.value.combo.options[props.entry.type.value.combo.def]!
          .id,
      );
      return (
        <div className="flex flex-col gap-1 max-w-xl">
          <ComponentTitle
            title={props.entry.uiName}
            description={props.entry.description}
          />
          <ComboComponent
            namespace={props.namespace}
            settingKey={props.settingKey}
            entry={props.entry.type.value.combo}
            value={value}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
    case 'stringList': {
      const value = getEntry(
        props.namespace,
        props.settingKey,
        profile,
        props.entry.type.value.stringList.def,
      );
      return (
        <div className="flex flex-col gap-1 max-w-xl">
          <ComponentTitle
            title={props.entry.uiName}
            description={props.entry.description}
          />
          <StringListComponent
            namespace={props.namespace}
            settingKey={props.settingKey}
            entry={props.entry.type.value.stringList}
            value={value}
            changeCallback={setValueMutation.mutate}
          />
        </div>
      );
    }
  }
}

function MinMaxComponentSingle(props: {
  namespace: string;
  entry: SettingEntryMinMaxPairSingle;
}) {
  const queryClient = useQueryClient();
  const instanceInfo = useContext(InstanceInfoContext);
  const profile = useContext(ProfileContext);
  const transport = useContext(TransportContext);
  const setValueMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      if (transport === null) {
        return;
      }

      const instanceService = new InstanceServiceClient(transport);
      await instanceService.updateInstanceConfig({
        id: instanceInfo.id,
        config: convertToProto(profile),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['instance-info', instanceInfo.id],
      });
    },
  });

  if (!props.entry.intSetting) {
    return null;
  }

  const value = getEntry(
    props.namespace,
    props.settingKey,
    profile,
    props.entry.type.value.int.def,
  );
  return (
    <div className="flex flex-col gap-1 max-w-xl">
      <ComponentTitle
        title={props.entry.uiName}
        description={props.entry.description}
      />
      <IntComponent
        namespace={props.namespace}
        settingKey={props.entry.key}
        entry={props.entry.intSetting}
        value={value}
        changeCallback={setValueMutation.mutate}
      />
    </div>
  );
}

function MinMaxComponent(props: {
  namespace: string;
  entry: SettingEntryMinMaxPair;
}) {
  if (!props.entry.min || !props.entry.max) {
    return null;
  }

  return (
    <>
      <MinMaxComponentSingle
        namespace={props.namespace}
        entry={props.entry.min}
      />
      <MinMaxComponentSingle
        namespace={props.namespace}
        entry={props.entry.max}
      />
    </>
  );
}

export default function ClientSettingsPageComponent({
  data,
}: {
  data: SettingsPage;
}) {
  return (
    <>
      {data.entries.map((page) => {
        if (page.value.oneofKind === 'single') {
          return (
            <SingleComponent
              namespace={data.namespace}
              key={'single|' + page.value.single.key}
              settingKey={page.value.single.key}
              entry={page.value.single}
            />
          );
        } else if (page.value.oneofKind === 'minMaxPair') {
          return (
            <MinMaxComponent
              namespace={data.namespace}
              key={
                'min-max|' +
                page.value.minMaxPair.min?.key +
                '|' +
                page.value.minMaxPair.max?.key
              }
              entry={page.value.minMaxPair}
            />
          );
        }
      })}
    </>
  );
}
