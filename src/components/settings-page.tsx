import type { JsonValue } from "@protobuf-ts/runtime";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import type { TFunction } from "i18next";
import { Check, ChevronsUpDown, PlusIcon, TrashIcon } from "lucide-react";
import {
  type ChangeEvent,
  type HTMLInputTypeAttribute,
  type ReactNode,
  use,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { NumericFormat } from "react-number-format";
import type { NumberFormatValues } from "react-number-format/types/types";
import { toast } from "sonner";
import DynamicIcon from "@/components/dynamic-icon.tsx";
import { TextInfoButton } from "@/components/info-buttons.tsx";
import {
  createSettingsRegistry,
  SettingsRegistryContext,
  useSettingsDefinition,
  useSettingsDefinitionByKey,
} from "@/components/providers/settings-registry-context.tsx";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  type BoolSetting,
  type ComboSetting,
  type DoubleSetting,
  type IntSetting,
  type MinMaxSetting,
  type MinMaxSetting_Entry,
  type SettingsDefinition,
  type SettingsEntryIdentifier,
  type SettingsPage,
  type StringListSetting,
  type StringSetting,
  StringSetting_InputType,
} from "@/generated/soulfire/common.ts";
import { useCachedState } from "@/hooks/use-cached-state.ts";
import { useLocaleNumberFormat } from "@/hooks/use-locale-number-format.tsx";
import type { BaseSettings } from "@/lib/types.ts";
import {
  cn,
  getSettingIdentifierKey,
  getSettingValue,
  updateInstanceConfigEntry,
  updateServerConfigEntry,
} from "@/lib/utils.tsx";

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
      toast.warning(t("settingsPage.invalidNumberToast.title"), {
        id: "invalid-number",
        description: t("settingsPage.invalidNumberToast.title", {
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
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && props.onClick) {
            e.preventDefault();
            props.onClick();
          }
        }}
        tabIndex={props.onClick ? 0 : undefined}
        className={cn({
          "cursor-pointer": props.onClick !== undefined,
        })}
      >
        {props.title}
      </p>
      <TextInfoButton value={props.description} />
    </div>
  );
}

function inputTypeToHtml(
  inputType: Exclude<StringSetting_InputType, StringSetting_InputType.TEXTAREA>,
): HTMLInputTypeAttribute {
  switch (inputType) {
    case StringSetting_InputType.TEXT:
      return "text";
    case StringSetting_InputType.PASSWORD:
      return "password";
    case StringSetting_InputType.EMAIL:
      return "email";
    case StringSetting_InputType.URL:
      return "url";
    case StringSetting_InputType.SEARCH:
      return "search";
    case StringSetting_InputType.TEL:
      return "tel";
  }
}

function StringComponent(props: {
  setting: StringSetting;
  value: string;
  changeCallback: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useCachedState(props.value);

  const onChangeHandler = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newValue = e.currentTarget.value;
    setInputValue(newValue);
    props.changeCallback(newValue);
  };

  if (props.setting.inputType === StringSetting_InputType.TEXTAREA) {
    return (
      <Textarea
        value={inputValue}
        placeholder={props.setting.placeholder}
        minLength={props.setting.minLength}
        maxLength={props.setting.maxLength}
        disabled={props.setting.disabled}
        onChange={onChangeHandler}
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
        onChange={onChangeHandler}
      />
    );
  }
}

function IntComponent(props: {
  setting: IntSetting;
  value: number;
  changeCallback: (value: number) => void;
}) {
  const { t } = useTranslation("common");
  const localeNumberFormat = useLocaleNumberFormat();
  const [inputValue, setInputValue] = useCachedState(props.value);

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
        const currentValue = parseInt(values.value, 10);

        if (!Number.isFinite(currentValue)) {
          return;
        }

        setInputValue(currentValue);
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
  const { t } = useTranslation("common");
  const localeNumberFormat = useLocaleNumberFormat();
  const [inputValue, setInputValue] = useCachedState(props.value);

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

        setInputValue(currentValue);
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
          if (value === "indeterminate") {
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
    throw new Error("Selected option not found");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-72 justify-between"
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
      <PopoverContent className="w-72 p-0">
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
                      "mr-2 h-4 w-4",
                      props.value === option.id ? "opacity-100" : "opacity-0",
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
  const { t } = useTranslation("common");
  const idValueArray = useMemo(
    () => makeIdValueArray(props.value),
    [props.value],
  );
  const [newEntryInput, setNewEntryInput] = useState("");

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
      <CardHeader>
        <div className="flex flex-row gap-1">
          <Input
            type="text"
            value={newEntryInput}
            onChange={(e) => {
              setNewEntryInput(e.currentTarget.value);
            }}
            placeholder={t("settingsPage.stringList.placeholder")}
            disabled={props.setting.disabled}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                insertValue(newEntryInput);
                setNewEntryInput("");
              }
            }}
          />
          <Button
            variant="outline"
            onClick={() => {
              insertValue(newEntryInput);
              setNewEntryInput("");
            }}
            disabled={props.setting.disabled}
          >
            <PlusIcon />
            {t("settingsPage.stringList.add")}
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
              <TrashIcon />
              {t("settingsPage.stringList.remove")}
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
  const { t } = useTranslation("common");
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
        const currentValue = parseInt(values.value, 10);

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

/**
 * Renders a setting type (the UI input component) with its value and change callback.
 * This is a pure presentation component that takes a setting type definition and renders it.
 */
export function SettingTypeRenderer(props: {
  settingType: SettingsDefinition["type"];
  value: JsonValue;
  changeCallback: (value: JsonValue) => void;
}) {
  if (!props.settingType || props.value === undefined) {
    return null;
  }

  switch (props.settingType.oneofKind) {
    case "string": {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.settingType.string.uiName}
            description={props.settingType.string.description}
          />
          <StringComponent
            setting={props.settingType.string}
            value={props.value as string}
            changeCallback={props.changeCallback}
          />
        </div>
      );
    }
    case "int": {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.settingType.int.uiName}
            description={props.settingType.int.description}
          />
          <IntComponent
            setting={props.settingType.int}
            value={props.value as number}
            changeCallback={props.changeCallback}
          />
        </div>
      );
    }
    case "bool": {
      return (
        <div className="flex max-w-xl flex-row gap-1">
          <BoolComponent
            setting={props.settingType.bool}
            value={props.value as boolean}
            changeCallback={props.changeCallback}
            title={props.settingType.bool.uiName}
            description={props.settingType.bool.description}
          />
        </div>
      );
    }
    case "double": {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.settingType.double.uiName}
            description={props.settingType.double.description}
          />
          <DoubleComponent
            setting={props.settingType.double}
            value={props.value as number}
            changeCallback={props.changeCallback}
          />
        </div>
      );
    }
    case "combo": {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.settingType.combo.uiName}
            description={props.settingType.combo.description}
          />
          <ComboComponent
            setting={props.settingType.combo}
            value={props.value as string}
            changeCallback={props.changeCallback}
          />
        </div>
      );
    }
    case "stringList": {
      return (
        <div className="flex max-w-xl flex-col gap-1">
          <ComponentTitle
            title={props.settingType.stringList.uiName}
            description={props.settingType.stringList.description}
          />
          <StringListComponent
            setting={props.settingType.stringList}
            value={props.value as string[]}
            changeCallback={props.changeCallback}
          />
        </div>
      );
    }
    case "minMax": {
      const castValue = props.value as {
        min: number;
        max: number;
      };
      return (
        <>
          <div className="flex max-w-xl flex-col gap-1">
            <ComponentTitle
              title={props.settingType.minMax.minEntry?.uiName}
              description={props.settingType.minMax.minEntry?.description}
            />
            <MinMaxComponent
              setting={props.settingType.minMax}
              entry={props.settingType.minMax.minEntry as MinMaxSetting_Entry}
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
              title={props.settingType.minMax.maxEntry?.uiName}
              description={props.settingType.minMax.maxEntry?.description}
            />
            <MinMaxComponent
              setting={props.settingType.minMax}
              entry={props.settingType.minMax.maxEntry as MinMaxSetting_Entry}
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

/**
 * Component that renders a setting field by its identifier.
 * This is the main component for mounting settings anywhere in the UI.
 * It looks up the setting definition from context and handles value management.
 */
function SettingField<T extends BaseSettings>(props: {
  settingId: SettingsEntryIdentifier;
  invalidateQuery: () => Promise<void>;
  updateConfigEntry: (
    namespace: string,
    key: string,
    value: JsonValue,
  ) => Promise<void>;
  config: T;
}) {
  const definition = useSettingsDefinition(props.settingId);
  const namespace = props.settingId.namespace;
  const key = props.settingId.key;
  const value = useMemo(
    () => getSettingValue(props.config, definition),
    [props.config, definition],
  );
  const setValueMutation = useMutation({
    mutationKey: ["setting", namespace, key],
    scope: { id: `setting-${namespace}-${key}` },
    mutationFn: async (value: JsonValue) => {
      await props.updateConfigEntry(namespace, key, value);
    },
    onSettled: async () => {
      await props.invalidateQuery();
    },
  });

  if (!definition) {
    return null;
  }

  return (
    <SettingTypeRenderer
      settingType={definition.type}
      value={value}
      changeCallback={setValueMutation.mutate}
    />
  );
}

export function InstanceSettingFieldByKey<T extends BaseSettings>(props: {
  namespace: string;
  settingKey: string;
  invalidateQuery: () => Promise<void>;
  updateConfigEntry: (
    namespace: string,
    key: string,
    value: JsonValue,
  ) => Promise<void>;
  config: T;
}) {
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const settingsRegistry = useMemo(
    () => createSettingsRegistry(instanceInfo.settingsDefinitions),
    [instanceInfo.settingsDefinitions],
  );

  return (
    <SettingsRegistryContext.Provider value={settingsRegistry}>
      <SettingFieldByKey {...props} />
    </SettingsRegistryContext.Provider>
  );
}

/**
 * Component that renders a setting field by namespace and key strings.
 * Convenience wrapper around SettingField for when you have separate strings.
 */
function SettingFieldByKey<T extends BaseSettings>(props: {
  namespace: string;
  settingKey: string;
  invalidateQuery: () => Promise<void>;
  updateConfigEntry: (
    namespace: string,
    key: string,
    value: JsonValue,
  ) => Promise<void>;
  config: T;
}) {
  const definition = useSettingsDefinitionByKey(
    props.namespace,
    props.settingKey,
  );
  const value = useMemo(
    () => getSettingValue(props.config, definition),
    [props.config, definition],
  );
  const setValueMutation = useMutation({
    mutationKey: ["setting", props.namespace, props.settingKey],
    scope: { id: `setting-${props.namespace}-${props.settingKey}` },
    mutationFn: async (value: JsonValue) => {
      await props.updateConfigEntry(props.namespace, props.settingKey, value);
    },
    onSettled: async () => {
      await props.invalidateQuery();
    },
  });

  if (!definition) {
    return null;
  }

  return (
    <SettingTypeRenderer
      settingType={definition.type}
      value={value}
      changeCallback={setValueMutation.mutate}
    />
  );
}

export type DisabledSettingId = {
  namespace: string;
  key: string;
};

function ClientSettingsPageComponent<T extends BaseSettings>({
  data,
  invalidateQuery,
  updateConfigEntry,
  config,
  disabledIds = [],
}: {
  data: SettingsPage;
  invalidateQuery: () => Promise<void>;
  updateConfigEntry: (
    namespace: string,
    key: string,
    value: JsonValue,
  ) => Promise<void>;
  config: T;
  disabledIds?: DisabledSettingId[];
}) {
  const enabledIdentifier = data.enabledIdentifier;
  const allDisabledIds = useMemo(() => {
    const result = [...disabledIds];
    if (enabledIdentifier) {
      result.push(enabledIdentifier);
    }
    return result;
  }, [disabledIds, enabledIdentifier]);

  return (
    <>
      {data.entries
        .filter(
          (entryId) =>
            !allDisabledIds.some(
              (id) =>
                entryId.namespace === id.namespace && entryId.key === id.key,
            ),
        )
        .map((entryId) => (
          <SettingField
            key={getSettingIdentifierKey(entryId)}
            settingId={entryId}
            updateConfigEntry={updateConfigEntry}
            invalidateQuery={invalidateQuery}
            config={config}
          />
        ))}
    </>
  );
}

export function InstanceSettingsPageComponent({
  data,
  disabledIds,
}: {
  data: SettingsPage;
  disabledIds?: DisabledSettingId[];
}) {
  const queryClient = useQueryClient();
  const instanceInfoQueryOptions = useRouteContext({
    from: "/_dashboard/instance/$instance",
    select: (context) => context.instanceInfoQueryOptions,
  });
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const transport = use(TransportContext);
  const { data: profile } = useSuspenseQuery({
    ...instanceInfoQueryOptions,
    select: (info) => info.profile,
  });
  const settingsRegistry = useMemo(
    () => createSettingsRegistry(instanceInfo.settingsDefinitions),
    [instanceInfo.settingsDefinitions],
  );
  return (
    <SettingsRegistryContext.Provider value={settingsRegistry}>
      <ClientSettingsPageComponent
        data={data}
        updateConfigEntry={async (namespace, key, value) =>
          await updateInstanceConfigEntry(
            namespace,
            key,
            value,
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
        disabledIds={disabledIds}
      />
    </SettingsRegistryContext.Provider>
  );
}

export function AdminSettingsPageComponent({ data }: { data: SettingsPage }) {
  const queryClient = useQueryClient();
  const serverInfoQueryOptions = useRouteContext({
    from: "/_dashboard/user/admin",
    select: (context) => context.serverInfoQueryOptions,
  });
  const { data: serverInfo } = useSuspenseQuery(serverInfoQueryOptions);
  const { data: serverConfig } = useSuspenseQuery({
    ...serverInfoQueryOptions,
    select: (info) => info.profile,
  });
  const transport = use(TransportContext);
  const settingsRegistry = useMemo(
    () => createSettingsRegistry(serverInfo.settingsDefinitions),
    [serverInfo.settingsDefinitions],
  );
  return (
    <SettingsRegistryContext.Provider value={settingsRegistry}>
      <ClientSettingsPageComponent
        data={data}
        updateConfigEntry={async (namespace, key, value) =>
          await updateServerConfigEntry(
            namespace,
            key,
            value,
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
    </SettingsRegistryContext.Provider>
  );
}
