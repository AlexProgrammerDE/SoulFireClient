import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from './ui/credenza';
import { Button } from '@/components/ui/button.tsx';

export type TauriInfo = {
  osType: string;
  osVersion: string;
  platformName: string;
  osLocale: string | null;
  archName: string;
} | null;

export function AboutPopup({
  open,
  setOpen,
  tauriInfo,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  tauriInfo: TauriInfo;
}) {
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
          {tauriInfo !== null ? (
            <>
              <p>
                Operating System: {tauriInfo.osType} {tauriInfo.osVersion}
              </p>
              <p>Platform: {tauriInfo.platformName}</p>
              <p>Locale: {tauriInfo.osLocale ?? 'Unknown'}</p>
              <p>Architecture: {tauriInfo.archName}</p>
            </>
          ) : (
            <>
              <p>Browser: {navigator.userAgent}</p>
              <p>Locale: {navigator.language}</p>
            </>
          )}
        </CredenzaBody>
        <CredenzaFooter>
          <CredenzaClose asChild>
            <Button>Close</Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
