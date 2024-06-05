import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle
} from "./ui/credenza";
import {Button} from "@/components/ui/button.tsx";
import {isTauri} from "@/lib/utils.ts";
import { version, type, platform, locale, arch } from '@tauri-apps/api/os';

const tauriInfo = isTauri() ? {
  osVersion: await version(),
    osType: await type(),
    platformName: await platform(),
    osLocale: await locale(),
    archName: await arch()
} : null

export function AboutPopup({open, setOpen}: { open: boolean, setOpen: (open: boolean) => void }) {
  return (
      <Credenza open={open} onOpenChange={setOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>About SoulFire</CredenzaTitle>
            <CredenzaDescription>
              You are running version {APP_VERSION} of the SoulFire client.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            {
              tauriInfo !== null ? (
                  <>
                    <p>Operating System: {tauriInfo.osType} {tauriInfo.osVersion}</p>
                    <p>Platform: {tauriInfo.platformName}</p>
                    <p>Locale: {tauriInfo.osLocale}</p>
                    <p>Architecture: {tauriInfo.archName}</p>
                  </>
              ) : (
                  <>
                    <p>Browser: {navigator.userAgent}</p>
                    <p>Locale: {navigator.language}</p>
                  </>
              )
            }
          </CredenzaBody>
          <CredenzaFooter>
            <CredenzaClose asChild>
              <Button>Close</Button>
            </CredenzaClose>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
  )
}
