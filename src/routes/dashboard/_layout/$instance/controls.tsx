import { createFileRoute } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import ControlsMenu from '@/components/controls-menu.tsx';
import { CommandInput } from '@/components/ui/command.tsx';

export const Route = createFileRoute('/dashboard/_layout/$instance/controls')({
  component: Console,
});

function TerminalSide() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <TerminalComponent />
      <CommandInput />
    </div>
  );
}

function Console() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <TerminalSide />
      <ControlsMenu />
    </div>
  );
}
