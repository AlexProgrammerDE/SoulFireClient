import { Input } from '@/components/ui/input.tsx';
import { KeyboardEventHandler, useContext, useState } from 'react';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { CommandServiceClient } from '@/generated/soulfire/command.client.ts';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';

type CompletionState = {
  lastWritten: string;
  receivedCompletions: string[] | null;
  index: number | null;
};

export default function CommandInput() {
  const transport = useContext(TransportContext);
  const instanceInfo = useContext(InstanceInfoContext);
  const [completionState, setCompletionState] = useState<CompletionState>({
    lastWritten: '',
    receivedCompletions: null,
    index: null,
  });

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    const currenTarget = e.currentTarget;
    if (e.key === 'Enter') {
      e.preventDefault();

      const currentVal = currenTarget.value;
      currenTarget.value = '';

      if (transport === null) {
        return;
      }

      const commandService = new CommandServiceClient(transport);
      void commandService.executeCommand({
        instanceId: instanceInfo.id,
        command: currentVal,
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();

      void handleTabPress(currenTarget.value, currenTarget);
    }
  };

  const handleTabPress = async (text: string, element: HTMLInputElement) => {
    if (transport === null) {
      return;
    }

    const commandService = new CommandServiceClient(transport);

    let completionStateNew: CompletionState;
    if (
      completionState.receivedCompletions === null ||
      completionState.index === null
    ) {
      const { response } = await commandService.tabCompleteCommand({
        instanceId: instanceInfo.id,
        command: text,
      });

      completionStateNew = {
        lastWritten: text,
        receivedCompletions: response.suggestions,
        index: 0,
      };
    } else if (completionState.receivedCompletions.length > 0) {
      const newIndex =
        (completionState.index + 1) %
        completionState.receivedCompletions.length;
      completionStateNew = {
        lastWritten: text,
        receivedCompletions: completionState.receivedCompletions,
        index: newIndex,
      };
    } else {
      completionStateNew = {
        lastWritten: text,
        receivedCompletions: [],
        index: 0,
      };
    }

    if (completionStateNew.receivedCompletions!.length > 0) {
      const split = completionStateNew.lastWritten.split(' ');
      split[split.length - 1] =
        completionStateNew.receivedCompletions![completionStateNew.index!];

      element.value = split.join(' ');
    }

    setCompletionState(completionStateNew);
  };

  return (
    <Input
      placeholder="Enter command"
      onKeyDown={handleKeyDown}
      onChange={(e) => {
        setCompletionState({
          lastWritten: e.currentTarget.value,
          receivedCompletions: null,
          index: null,
        });
      }}
    />
  );
}
