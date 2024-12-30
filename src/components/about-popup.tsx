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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemInfo !== null ? (
                <>
                  <TableRow>
                    <TableCell>Operating System</TableCell>
                    <TableCell>
                      {systemInfo.osType} {systemInfo.osVersion}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Platform</TableCell>
                    <TableCell>{systemInfo.platformName}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Locale</TableCell>
                    <TableCell>{systemInfo.osLocale ?? 'Unknown'}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Architecture</TableCell>
                    <TableCell>{systemInfo.archName}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Environment</TableCell>
                    <TableCell>{APP_ENVIRONMENT}</TableCell>
                  </TableRow>
                </>
              ) : (
                <>
                  <TableRow>
                    <TableCell>Browser</TableCell>
                    <TableCell>{navigator.userAgent}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Locale</TableCell>
                    <TableCell>{navigator.language}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Environment</TableCell>
                    <TableCell>{APP_ENVIRONMENT}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
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
