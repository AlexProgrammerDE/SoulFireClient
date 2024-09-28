import { createFileRoute } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import ControlsMenu from '@/components/controls-menu.tsx';
import CommandInput from '@/components/command-input.tsx';

export const Route = createFileRoute('/dashboard/_layout/$instance/controls')({
  component: Console,
});

function Console() {
  return (
    <div className="flex h-full w-full flex-col gap-2 py-2 pl-2">
      <div className="flex flex-col gap-2">
        <TerminalComponent />
        <CommandInput />
      </div>
      <ControlsMenu />
    </div>
  );
}
