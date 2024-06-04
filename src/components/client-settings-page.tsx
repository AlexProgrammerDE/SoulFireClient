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
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command.tsx";
import {Check, ChevronsUpDown} from "lucide-react";
import {cn} from "@/lib/utils.ts";
import {useState} from "react";
import {Input} from "@/components/ui/input.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";

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

  return (
      <Input type={props.entry.secret ? "password" : "text"}
             value={value} onChange={e => setValue(e.currentTarget.value)}/>
  )
}

function IntComponent(props: { namespace: string, settingKey: string, entry: IntSetting }) {
  const [value, setValue] = useState(props.entry.def)

  return (
      <Input type="number"
             min={props.entry.min}
             max={props.entry.max}
             step={props.entry.step}
             value={value} onChange={e => setValue(parseInt(e.currentTarget.value))}/>
  )
}

function DoubleComponent(props: { namespace: string, settingKey: string, entry: DoubleSetting }) {
  const [value, setValue] = useState(props.entry.def)

  return (
      <Input type="number"
             min={props.entry.min}
             max={props.entry.max}
             step={props.entry.step}
             value={value} onChange={e => setValue(parseFloat(e.currentTarget.value))}/>
  )
}

function BoolComponent(props: { namespace: string, settingKey: string, entry: BoolSetting }) {
  const [value, setValue] = useState(props.entry.def)

  return (
      <Checkbox checked={value} onChange={e => setValue(Boolean(e.currentTarget.value))}/>
  )
}

function ComboComponent(props: { namespace: string, settingKey: string, entry: ComboSetting }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(props.entry.options[props.entry.def].id)

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
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {props.entry.options.map((framework) => (
                    <CommandItem
                        key={framework.id}
                        value={framework.id}
                        onSelect={(currentValue) => {
                          setValue(currentValue === value ? "" : currentValue)
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
