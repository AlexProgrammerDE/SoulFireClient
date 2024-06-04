import {
  BoolSetting,
  ClientPluginSettingEntryMinMaxPair,
  ClientPluginSettingEntrySingle,
  ClientPluginSettingsPage,
  ClientPluginSettingType,
  ComboSetting,
  DoubleSetting,
  IntSetting,
  StringSetting
} from "@/generated/com/soulfiremc/grpc/generated/config.ts";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover.tsx";
import {Command, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command.tsx";
import {Check, ChevronsUpDown} from "lucide-react";
import {cn} from "@/lib/utils.ts";
import {useContext, useState} from "react";
import {Input} from "@/components/ui/input.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ProfileContext} from "@/components/providers/profile-context.tsx";
import {ProfileRoot, ProfileSettingsJSDataTypes, WrappedDouble, WrappedInteger} from "@/lib/types.ts";

function updateEntry(namespace: string, settingKey: string, value: ProfileSettingsJSDataTypes, profile: ProfileRoot): ProfileRoot {
  return {
    ...profile,
    settings: {
      ...profile.settings,
      [namespace]: {
        ...profile.settings[namespace] || {},
        [settingKey]: value
      }
    }
  }
}

function ComponentTitle(props: { title: string, description: string }) {
  return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="w-fit">{props.title}</TooltipTrigger>
          <TooltipContent>
            <p>{props.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
  )
}

function StringComponent(props: { namespace: string, settingKey: string, entry: StringSetting }) {
  const [value, setValue] = useState(props.entry.def)
  const profile = useContext(ProfileContext)

  return (
      <Input type={props.entry.secret ? "password" : "text"}
             defaultValue={value} onChange={e => {
        const value = e.currentTarget.value
        setValue(value)
        profile.setProfile(updateEntry(props.namespace, props.settingKey, value, profile.profile))
      }}/>
  )
}

function IntComponent(props: { namespace: string, settingKey: string, entry: IntSetting }) {
  const [value, setValue] = useState(props.entry.def)
  const profile = useContext(ProfileContext)

  return (
      <Input type="number"
             min={props.entry.min}
             max={props.entry.max}
             step={props.entry.step}
             defaultValue={value} onChange={e => {
        const value = parseInt(e.currentTarget.value)
        setValue(value)
        profile.setProfile(updateEntry(props.namespace, props.settingKey, new WrappedInteger(value), profile.profile))
      }}/>
  )
}

function DoubleComponent(props: { namespace: string, settingKey: string, entry: DoubleSetting }) {
  const [value, setValue] = useState(props.entry.def)
  const profile = useContext(ProfileContext)

  return (
      <Input type="number"
             min={props.entry.min}
             max={props.entry.max}
             step={props.entry.step}
             defaultValue={value} onChange={e => {
        const value = parseFloat(e.currentTarget.value)
        setValue(value)
        profile.setProfile(updateEntry(props.namespace, props.settingKey, new WrappedDouble(value), profile.profile))
      }}/>
  )
}

function BoolComponent(props: { namespace: string, settingKey: string, entry: BoolSetting }) {
  const [value, setValue] = useState(props.entry.def)
  const profile = useContext(ProfileContext)

  return (
      <Checkbox defaultChecked={value} onChange={e => {
        const value = Boolean(e.currentTarget.value)
        setValue(value)
        profile.setProfile(updateEntry(props.namespace, props.settingKey, value, profile.profile))
      }}/>
  )
}

function ComboComponent(props: { namespace: string, settingKey: string, entry: ComboSetting }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(props.entry.options[props.entry.def].id)
  const profile = useContext(ProfileContext)

  return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between"
          >
            {value
                ? props.entry.options.find((framework) => framework.id === value)?.displayName
                : "Select value..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search value..."/>
            <CommandList>
              <CommandGroup>
                {props.entry.options.map((framework) => (
                    <CommandItem
                        key={framework.id}
                        value={framework.id}
                        onSelect={(currentValue) => {
                          const value = currentValue
                          setValue(value)
                          profile.setProfile(updateEntry(props.namespace, props.settingKey, value, profile.profile))
                          setOpen(false)
                        }}
                    >
                      <Check
                          className={cn(
                              "mr-2 h-4 w-4",
                              value === framework.id ? "opacity-100" : "opacity-0"
                          )}
                      />
                      {framework.displayName}
                    </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
  )
}

function SingularSettingInput(props: { namespace: string, settingKey: string, entry: ClientPluginSettingType }) {
  switch (props.entry.value.oneofKind) {
    case "string":
      return <StringComponent namespace={props.namespace} settingKey={props.settingKey}
                              entry={props.entry.value.string}/>
    case "int":
      return <IntComponent namespace={props.namespace} settingKey={props.settingKey} entry={props.entry.value.int}/>
    case "bool":
      return <BoolComponent namespace={props.namespace} settingKey={props.settingKey} entry={props.entry.value.bool}/>
    case "double":
      return <DoubleComponent namespace={props.namespace} settingKey={props.settingKey}
                              entry={props.entry.value.double}/>
    case "combo":
      return <ComboComponent namespace={props.namespace} settingKey={props.settingKey} entry={props.entry.value.combo}/>
  }
}

function SingleComponent(props: { namespace: string, entry: ClientPluginSettingEntrySingle }) {
  if (!props.entry.type) {
    return null
  }

  return (
      <div className="flex flex-col gap-1">
        <ComponentTitle title={props.entry.uiName} description={props.entry.description}/>
        <SingularSettingInput namespace={props.namespace} settingKey={props.entry.key} entry={props.entry.type}/>
      </div>
  )
}

function MinMaxComponent(props: { namespace: string, entry: ClientPluginSettingEntryMinMaxPair }) {
  if (!props.entry.min || !props.entry.max || !props.entry.min.intSetting || !props.entry.max.intSetting) {
    return null
  }

  return (
      <>
        <div className="flex flex-col gap-1">
          <ComponentTitle title={props.entry.min.uiName} description={props.entry.min.description}/>
          <IntComponent namespace={props.namespace} settingKey={props.entry.min.key}
                        entry={props.entry.min.intSetting}/>
        </div>
        <div className="flex flex-col gap-1">
          <ComponentTitle title={props.entry.max.uiName} description={props.entry.max.description}/>
          <IntComponent namespace={props.namespace} settingKey={props.entry.max.key}
                        entry={props.entry.max.intSetting}/>
        </div>
      </>
  )
}

export default function ClientSettingsPageComponent({data}: { data: ClientPluginSettingsPage }) {
  return (
      <>
        {
          data.entries.map((page) => {
            if (page.value.oneofKind === "single") {
              return <SingleComponent
                  namespace={data.namespace}
                  key={"single|" + page.value.single.key}
                  entry={page.value.single}/>
            } else if (page.value.oneofKind === "minMaxPair") {
              return <MinMaxComponent
                  namespace={data.namespace}
                  key={"min-max|" + page.value.minMaxPair.min?.key + "|" + page.value.minMaxPair.max?.key}
                  entry={page.value.minMaxPair}/>
            }
          })
        }
      </>
  )
}
