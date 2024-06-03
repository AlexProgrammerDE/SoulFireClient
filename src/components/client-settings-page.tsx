import {
  ClientPluginSettingEntryMinMaxPair, ClientPluginSettingEntrySingle,
  ClientPluginSettingsPage
} from "@/generated/com/soulfiremc/grpc/generated/config.ts";

function SingleComponent({entry}: {entry: ClientPluginSettingEntrySingle}) {
  return (
      <div>
        <p>{entry.uiName}</p>
      </div>
  )
}

function MinMaxComponent({entry}: {entry: ClientPluginSettingEntryMinMaxPair}) {
  return (
      <>
        <div>
          <p>{entry.min?.uiName}</p>
        </div>
        <div>
          <p>{entry.max?.uiName}</p>
        </div>
      </>
  )
}

export default function ClientSettingsPageComponent({data}: {data: ClientPluginSettingsPage}) {
  return (
      <>
        {
          data.entries.map((page) => {
            if (page.value.oneofKind === "single") {
              return <SingleComponent key={"single|" + page.value.single.key}
                                      entry={page.value.single}/>
            } else if (page.value.oneofKind === "minMaxPair") {
              return <MinMaxComponent key={"min-max|" + page.value.minMaxPair.min?.key + "|" + page.value.minMaxPair.max?.key}
                                      entry={page.value.minMaxPair}/>
            }
          })
        }
      </>
  )
}
