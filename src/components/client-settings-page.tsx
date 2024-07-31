import {
  BoolSetting,
  ClientPluginSettingEntryMinMaxPair,
  ClientPluginSettingEntryMinMaxPairSingle,
  ClientPluginSettingEntrySingle,
  ClientPluginSettingsPage,
  ComboSetting,
  DoubleSetting,
  IntSetting,
  StringSetting,
} from '@/generated/com/soulfiremc/grpc/generated/config.ts';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
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
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Input } from '@/components/ui/input.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { convertToProto, ProfileRoot } from '@/lib/types.ts';
import { JsonValue } from '@protobuf-ts/runtime';
import { useDebouncedCallback } from 'use-debounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InstanceServiceClient } from '@/generated/com/soulfiremc/grpc/generated/instance.client.ts';
import { queryClient } from '@/lib/query.ts';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';

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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="w-fit">{props.title}</TooltipTrigger>
        <TooltipContent>
          <p>{props.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function StringComponent(props: {
  namespace: string;
  settingKey: string;
  entry: StringSetting;
  changeCallback: (value: JsonValue) => void;
  allowsRemoteUpdate: boolean;
}) {
  const profile = useContext(ProfileContext);
  const serverValue = getEntry(
    props.namespace,
    props.settingKey,
    profile,
    props.entry.def,
  );
  const [value, setValue] = useState(serverValue);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.allowsRemoteUpdate && value !== serverValue) {
      setValue(serverValue);
      if (ref.current) {
        ref.current.value = serverValue as string;
      }
    }
  }, [profile, props.allowsRemoteUpdate, serverValue, value]);

  return (
    <Input
      ref={ref}
      type={props.entry.secret ? 'password' : 'text'}
      defaultValue={value as string}
      onChange={(e) => {
        const value = e.currentTarget.value;
        setValue(value);
        props.changeCallback(value);
      }}
    />
  );
}

function IntComponent(props: {
  namespace: string;
  settingKey: string;
  entry: IntSetting;
  changeCallback: (value: JsonValue) => void;
  allowsRemoteUpdate: boolean;
}) {
  const profile = useContext(ProfileContext);
  const serverValue = getEntry(
    props.namespace,
    props.settingKey,
    profile,
    props.entry.def,
  );
  const [value, setValue] = useState(serverValue);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.allowsRemoteUpdate && value !== serverValue) {
      setValue(serverValue);
      if (ref.current) {
        ref.current.value = serverValue as string;
      }
    }
  }, [profile, props.allowsRemoteUpdate, serverValue, value]);

  return (
    <Input
      ref={ref}
      type="number"
      min={props.entry.min}
      max={props.entry.max}
      step={props.entry.step}
      defaultValue={value as number}
      onChange={(e) => {
        const value = parseInt(e.currentTarget.value);
        setValue(value);
        props.changeCallback(value);
      }}
    />
  );
}

function DoubleComponent(props: {
  namespace: string;
  settingKey: string;
  entry: DoubleSetting;
  changeCallback: (value: JsonValue) => void;
  allowsRemoteUpdate: boolean;
}) {
  const profile = useContext(ProfileContext);
  const serverValue = getEntry(
    props.namespace,
    props.settingKey,
    profile,
    props.entry.def,
  );
  const [value, setValue] = useState(serverValue);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.allowsRemoteUpdate && value !== serverValue) {
      setValue(serverValue);
      if (ref.current) {
        ref.current.value = serverValue as string;
      }
    }
  }, [profile, props.allowsRemoteUpdate, serverValue, value]);

  return (
    <Input
      ref={ref}
      type="number"
      min={props.entry.min}
      max={props.entry.max}
      step={props.entry.step}
      defaultValue={value as number}
      onChange={(e) => {
        const value = parseFloat(e.currentTarget.value);
        setValue(value);
        props.changeCallback(value);
      }}
    />
  );
}

function BoolComponent(props: {
  namespace: string;
  settingKey: string;
  entry: BoolSetting;
  changeCallback: (value: JsonValue) => void;
  allowsRemoteUpdate: boolean;
}) {
  const profile = useContext(ProfileContext);
  const serverValue = getEntry(
    props.namespace,
    props.settingKey,
    profile,
    props.entry.def,
  );
  const [value, setValue] = useState(serverValue);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (props.allowsRemoteUpdate && value !== serverValue) {
      setValue(serverValue);
      if (ref.current) {
        ref.current.click();
      }
    }
  }, [profile, props.allowsRemoteUpdate, serverValue, value]);

  return (
    <Checkbox
      ref={ref}
      className="my-auto"
      defaultChecked={value as boolean}
      onCheckedChange={(value) => {
        setValue(value);
        props.changeCallback(value);
      }}
    />
  );
}

function ComboComponent(props: {
  namespace: string;
  settingKey: string;
  entry: ComboSetting;
  changeCallback: (value: JsonValue) => void;
  allowsRemoteUpdate: boolean;
}) {
  const [open, setOpen] = useState(false);
  const profile = useContext(ProfileContext);
  const serverValue = getEntry(
    props.namespace,
    props.settingKey,
    profile,
    props.entry.options[props.entry.def].id,
  );
  const [value, setValue] = useState(serverValue);

  useEffect(() => {
    if (props.allowsRemoteUpdate && value !== serverValue) {
      setValue(serverValue);
    }
  }, [profile, props.allowsRemoteUpdate, serverValue, value]);

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
            props.entry.options.find((option) => option.id === value)
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
                    const value = currentValue;
                    setValue(value);
                    props.changeCallback(value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.id ? 'opacity-100' : 'opacity-0',
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

function SingleComponent(props: {
  namespace: string;
  settingKey: string;
  entry: ClientPluginSettingEntrySingle;
}) {
  const queryClient = useQueryClient();
  const instanceInfo = useContext(InstanceInfoContext);
  const profile = useContext(ProfileContext);
  const transport = useContext(TransportContext);
  const [recentlyChanged, setRecentlyChanged] = useState(false);
  const recentlyChangedBouncer = useDebouncedCallback(() => {
    setRecentlyChanged(false);
  }, 5_000);
  const setProfileMutation = useMutation({
    mutationFn: async (profile: ProfileRoot) => {
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
  const write = useDebouncedCallback((value: JsonValue) => {
    setProfileMutation.mutate(
      updateEntry(props.namespace, props.settingKey, value, profile),
    );
  }, 100);
  const changeCallback = useCallback(
    (value: JsonValue) => {
      setRecentlyChanged(true);
      recentlyChangedBouncer();
      write(value);
    },
    [recentlyChangedBouncer, write],
  );
  const mutationNotRunning =
    setProfileMutation.isIdle || setProfileMutation.isSuccess;
  const allowsRemoteUpdate = useMemo(() => {
    return (
      !recentlyChanged &&
      mutationNotRunning &&
      queryClient.isFetching({
        queryKey: ['instance-info', instanceInfo.id],
      }) === 0
    );
  }, [recentlyChanged, mutationNotRunning, queryClient, instanceInfo.id]);

  if (!props.entry.type) {
    return null;
  }

  switch (props.entry.type.value.oneofKind) {
    case 'string':
      return (
        <div className="flex flex-col gap-1">
          <ComponentTitle
            title={props.entry.uiName}
            description={props.entry.description}
          />
          <StringComponent
            namespace={props.namespace}
            settingKey={props.settingKey}
            entry={props.entry.type.value.string}
            changeCallback={changeCallback}
            allowsRemoteUpdate={allowsRemoteUpdate}
          />
        </div>
      );
    case 'int':
      return (
        <div className="flex flex-col gap-1">
          <ComponentTitle
            title={props.entry.uiName}
            description={props.entry.description}
          />
          <IntComponent
            namespace={props.namespace}
            settingKey={props.settingKey}
            entry={props.entry.type.value.int}
            changeCallback={changeCallback}
            allowsRemoteUpdate={allowsRemoteUpdate}
          />
        </div>
      );
    case 'bool':
      return (
        <div className="flex flex-row gap-1">
          <BoolComponent
            namespace={props.namespace}
            settingKey={props.settingKey}
            entry={props.entry.type.value.bool}
            changeCallback={changeCallback}
            allowsRemoteUpdate={allowsRemoteUpdate}
          />
          <ComponentTitle
            title={props.entry.uiName}
            description={props.entry.description}
          />
        </div>
      );
    case 'double':
      return (
        <div className="flex flex-col gap-1">
          <ComponentTitle
            title={props.entry.uiName}
            description={props.entry.description}
          />
          <DoubleComponent
            namespace={props.namespace}
            settingKey={props.settingKey}
            entry={props.entry.type.value.double}
            changeCallback={changeCallback}
            allowsRemoteUpdate={allowsRemoteUpdate}
          />
        </div>
      );
    case 'combo':
      return (
        <div className="flex flex-col gap-1">
          <ComponentTitle
            title={props.entry.uiName}
            description={props.entry.description}
          />
          <ComboComponent
            namespace={props.namespace}
            settingKey={props.settingKey}
            entry={props.entry.type.value.combo}
            changeCallback={changeCallback}
            allowsRemoteUpdate={allowsRemoteUpdate}
          />
        </div>
      );
  }
}

function MinMaxComponentSingle(props: {
  namespace: string;
  entry: ClientPluginSettingEntryMinMaxPairSingle;
}) {
  const queryClient = useQueryClient();
  const instanceInfo = useContext(InstanceInfoContext);
  const profile = useContext(ProfileContext);
  const transport = useContext(TransportContext);
  const [recentlyChanged, setRecentlyChanged] = useState(false);
  const recentlyChangedBouncer = useDebouncedCallback(() => {
    setRecentlyChanged(false);
  }, 5_000);
  const setProfileMutation = useMutation({
    mutationFn: async (profile: ProfileRoot) => {
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
  const write = useDebouncedCallback((value: JsonValue) => {
    setProfileMutation.mutate(
      updateEntry(props.namespace, props.entry.key, value, profile),
    );
  }, 100);
  const changeCallback = useCallback(
    (value: JsonValue) => {
      setRecentlyChanged(true);
      recentlyChangedBouncer();
      write(value);
    },
    [recentlyChangedBouncer, write],
  );
  const mutationNotRunning =
    setProfileMutation.isIdle || setProfileMutation.isSuccess;
  const allowsRemoteUpdate = useMemo(() => {
    return (
      !recentlyChanged &&
      mutationNotRunning &&
      queryClient.isFetching({
        queryKey: ['instance-info', instanceInfo.id],
      }) === 0
    );
  }, [recentlyChanged, mutationNotRunning, queryClient, instanceInfo.id]);

  if (!props.entry.intSetting) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <ComponentTitle
        title={props.entry.uiName}
        description={props.entry.description}
      />
      <IntComponent
        namespace={props.namespace}
        settingKey={props.entry.key}
        entry={props.entry.intSetting}
        changeCallback={changeCallback}
        allowsRemoteUpdate={allowsRemoteUpdate}
      />
    </div>
  );
}

function MinMaxComponent(props: {
  namespace: string;
  entry: ClientPluginSettingEntryMinMaxPair;
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
  data: ClientPluginSettingsPage;
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
