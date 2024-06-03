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
            Tauri: {isTauri() ? "Yes" : "No"}
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
