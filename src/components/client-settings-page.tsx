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

function ComponentTitle({title, description}: { title: string, description: string }) {
  return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="w-fit">{title}</TooltipTrigger>
          <TooltipContent>
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
  )
}

function StringComponent({entry}: { entry: StringSetting }) {
  const [value, setValue] = useState(entry.def)

  return (
      <Input type="text" value={value} onChange={e => setValue(e.currentTarget.value)}/>
  )
}

function IntComponent({entry}: { entry: IntSetting }) {
  const [value, setValue] = useState(entry.def)

  return (
      <Input type="number"
             min={entry.min}
                max={entry.max}
             step={entry.step}
             value={value} onChange={e => setValue(parseInt(e.currentTarget.value))}/>
  )
}

function DoubleComponent({entry}: { entry: DoubleSetting }) {
  const [value, setValue] = useState(entry.def)

  return (
      <Input type="number" value={value} onChange={e => setValue(parseFloat(e.currentTarget.value))}/>
  )
}

function BoolComponent({entry}: { entry: BoolSetting }) {
  const [value, setValue] = useState(entry.def)

  return (
      <Checkbox checked={value} onChange={e => setValue(Boolean(e.currentTarget.value))}/>
  )
}

function ComboComponent({entry}: { entry: ComboSetting }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(entry.options[entry.def].id)

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
                ? entry.options.find((framework) => framework.id === value)?.displayName
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
                {entry.options.map((framework) => (
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

function SingularSettingInput({
                                entry: {
                                  value
                                }
                              }: { entry: ClientPluginSettingType }) {
  switch (value.oneofKind) {
    case "string":
      return <StringComponent entry={value.string}/>
    case "int":
      return <IntComponent entry={value.int}/>
    case "bool":
      return <BoolComponent entry={value.bool}/>
    case "double":
      return <DoubleComponent entry={value.double}/>
    case "combo":
      return <ComboComponent entry={value.combo}/>
  }
}

function SingleComponent({entry}: { entry: ClientPluginSettingEntrySingle }) {
  if (!entry.type) {
    return null
  }

  return (
      <div className="flex flex-col gap-1">
        <ComponentTitle title={entry.uiName} description={entry.description}/>
        <SingularSettingInput entry={entry.type}/>
      </div>
  )
}

function MinMaxComponent({entry}: { entry: ClientPluginSettingEntryMinMaxPair }) {
  if (!entry.min || !entry.max || !entry.min.intSetting || !entry.max.intSetting) {
    return null
  }

  return (
      <>
        <div className="flex flex-col gap-1">
          <ComponentTitle title={entry.min.uiName} description={entry.min.description}/>
          <IntComponent entry={entry.min.intSetting}/>
        </div>
        <div className="flex flex-col gap-1">
          <ComponentTitle title={entry.max.uiName} description={entry.max.description}/>
            <IntComponent entry={entry.max.intSetting}/>
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
              return <SingleComponent key={"single|" + page.value.single.key}
                                      entry={page.value.single}/>
            } else if (page.value.oneofKind === "minMaxPair") {
              return <MinMaxComponent
                  key={"min-max|" + page.value.minMaxPair.min?.key + "|" + page.value.minMaxPair.max?.key}
                  entry={page.value.minMaxPair}/>
            }
          })
        }
      </>
  )
}
