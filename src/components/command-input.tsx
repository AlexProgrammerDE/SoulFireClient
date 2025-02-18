import { Input } from '@/components/ui/input.tsx';
import { KeyboardEventHandler, useContext, useState } from 'react';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { CommandServiceClient } from '@/generated/soulfire/command.client.ts';
import {
  CommandCompletion,
  CommandCompletionRequest,
  CommandRequest,
} from '@/generated/soulfire/command.ts';
import { useTranslation } from 'react-i18next';

type CompletionState = {
  lastWritten: string;
  receivedCompletions: CommandCompletion[] | null;
  index: number | null;
};

const SF_COMMAND_HISTORY_KEY = 'sf-command-history';
const SF_COMMAND_HISTORY_LENGTH = 100;

export default function CommandInput(props: {
  scope: CommandRequest['scope'] | CommandCompletionRequest['scope'];
}) {
  const { t } = useTranslation('common');
  const transport = useContext(TransportContext);
  const [commandHistory, setCommandHistory] = useState<string[]>(
    JSON.parse(localStorage.getItem(SF_COMMAND_HISTORY_KEY) ?? '[]'),
  );
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [completionState, setCompletionState] = useState<CompletionState>({
    lastWritten: '',
    receivedCompletions: null,
    index: null,
  });

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    const currentTarget = e.currentTarget;
    if (e.key === 'Enter') {
      e.preventDefault();

      const currentVal = currentTarget.value.trim();
      currentTarget.value = '';

      if (transport === null) {
        return;
      }

      if (currentVal === '') {
        return;
      }

      setCommandHistory((prev) => {
        if (prev[prev.length - 1] !== currentVal) {
          while (prev.length >= SF_COMMAND_HISTORY_LENGTH) {
            prev.shift();
          }

          const newHistory = [...prev, currentVal];
          localStorage.setItem(
            SF_COMMAND_HISTORY_KEY,
            JSON.stringify(newHistory),
          );
          return newHistory;
        } else {
          return prev;
        }
      });

      const commandService = new CommandServiceClient(transport);
      void commandService.executeCommand({
        scope: props.scope,
        command: currentVal,
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();

      void handleTabPress(currentTarget.value, currentTarget);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();

      if (commandHistory.length === 0) {
        return;
      }

      if (historyIndex === -1) {
        setHistoryIndex(commandHistory.length - 1);
        currentTarget.value = commandHistory[commandHistory.length - 1];
      } else if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
        currentTarget.value = commandHistory[historyIndex - 1];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();

      if (commandHistory.length === 0) {
        return;
      }

      if (historyIndex === commandHistory.length - 1) {
        setHistoryIndex(-1);
        currentTarget.value = '';
      } else if (historyIndex >= 0) {
        setHistoryIndex(historyIndex + 1);
        currentTarget.value = commandHistory[historyIndex + 1];
      }
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
        scope: props.scope,
        command: text,
        cursor: text.length,
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
        completionStateNew.receivedCompletions![
          completionStateNew.index!
        ].suggestion;

      element.value = split.join(' ');
    }

    setCompletionState(completionStateNew);
  };

  return (
    <Input
      placeholder={t('commandInput.placeholder')}
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
