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
import { SystemInfoContext } from '@/components/providers/system-info-context.tsx';
import { useContext } from 'react';

export function AboutPopup({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const systemInfo = useContext(SystemInfoContext);

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
          {systemInfo !== null ? (
            <>
              <p>
                Operating System: {systemInfo.osType} {systemInfo.osVersion}
              </p>
              <p>Platform: {systemInfo.platformName}</p>
              <p>Locale: {systemInfo.osLocale ?? 'Unknown'}</p>
              <p>Architecture: {systemInfo.archName}</p>
            </>
          ) : (
            <>
              <p>Browser: {navigator.userAgent}</p>
              <p>Locale: {navigator.language}</p>
              <p>Environment: {APP_ENVIRONMENT}</p>
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
