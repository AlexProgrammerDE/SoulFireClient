import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from '@/components/ui/credenza.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useRef, useState } from 'react';
import { isTauri } from '@/lib/utils.ts';
import { downloadDir } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import * as clipboard from '@tauri-apps/plugin-clipboard-manager';
import { ClipboardIcon, FileIcon, TextIcon } from 'lucide-react';

export default function ImportDialog(props: {
  title: string;
  description: string;
  closer: () => void;
  listener: (text: string) => void;
}) {
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Credenza open={true} onOpenChange={props.closer}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{props.title}</CredenzaTitle>
          <CredenzaDescription>{props.description}</CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between gap-4">
              {!isTauri() && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = (e.target as HTMLInputElement).files?.item(0);
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = () => {
                      const data = reader.result as string;
                      props.listener(data);
                    };
                    reader.readAsText(file);
                  }}
                />
              )}
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  if (isTauri()) {
                    void (async () => {
                      const downloadsDir = await downloadDir();
                      const input = await open({
                        title: props.title,
                        filters: [{ name: 'Text', extensions: ['txt'] }],
                        defaultPath: downloadsDir,
                        multiple: false,
                        directory: false,
                      });

                      if (input) {
                        const data = await readTextFile(input);

                        props.listener(data);
                      }
                    })();
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <FileIcon className="w-4 h-4 mr-2" />
                <span>From file</span>
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  void (async () => {
                    if (isTauri()) {
                      props.listener((await clipboard.readText()) ?? '');
                    } else {
                      props.listener(await navigator.clipboard.readText());
                    }
                  })();
                }}
              >
                <ClipboardIcon className="w-4 h-4 mr-2" />
                <span>From clipboard</span>
              </Button>
            </div>
            <Textarea
              placeholder="Put text here..."
              defaultValue={inputText}
              onChange={(e) => setInputText(e.currentTarget.value)}
            />
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => props.listener(inputText)}
            >
              <TextIcon className="w-4 h-4 mr-2" />
              <span>Load from text</span>
            </Button>
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
