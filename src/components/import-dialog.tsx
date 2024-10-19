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
import { useContext, useRef, useState } from 'react';
import { isTauri } from '@/lib/utils.ts';
import { downloadDir } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import * as clipboard from '@tauri-apps/plugin-clipboard-manager';
import { ClipboardIcon, FileIcon, GlobeIcon, TextIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator.tsx';
import { Input } from '@/components/ui/input.tsx';
import { toast } from 'sonner';
import MimeMatcher from 'mime-matcher';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { DownloadServiceClient } from '@/generated/soulfire/download.client.ts';
import { SystemInfoContext } from '@/components/providers/system-info-context.tsx';

export type TextInput = {
  defaultValue: string;
};

export type ImportDialogProps = {
  title: string;
  description: string;
  closer: () => void;
  listener: (data: string) => void;
  filters: {
    name: string;
    mimeType: string;
    extensions: string[];
  }[];
  allowMultiple: boolean;
  textInput: TextInput | null;
};

export default function ImportDialog(props: ImportDialogProps) {
  const [menuState, setMenuState] = useState<'main' | 'url'>('main');

  switch (menuState) {
    case 'url':
      return <UrlDialog {...props} />;
    case 'main':
      return (
        <MainDialog {...props} openUrlDialog={() => setMenuState('url')} />
      );
  }
}

function UrlDialog(props: ImportDialogProps) {
  const transport = useContext(TransportContext);
  const [inputText, setInputText] = useState('');

  return (
    <Credenza open={true} onOpenChange={props.closer}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{props.title}</CredenzaTitle>
          <CredenzaDescription>
            Loading from URL will make the SoulFire server make a GET request to
            the target server and use the response as the data.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="pb-4 md:pb-0">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <Input
                autoFocus
                placeholder="Put URL here..."
                defaultValue={inputText}
                type="url"
                onChange={(e) => setInputText(e.currentTarget.value)}
              />
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  if (inputText === '') {
                    toast.error('Please enter a valid URL');
                    return;
                  }

                  const download = async () => {
                    if (transport === null) {
                      return;
                    }

                    const service = new DownloadServiceClient(transport);
                    const { response } = await service.download({
                      uri: inputText,
                      headers: [],
                    });

                    const decoder = new TextDecoder();
                    props.listener(decoder.decode(response.data));
                  };

                  toast.promise(download(), {
                    loading: 'Downloading data...',
                    success: 'Data loaded',
                    error: (e) => {
                      console.error(e);
                      return 'Failed to download data';
                    },
                  });
                }}
              >
                <GlobeIcon className="w-4 h-4 mr-2" />
                <span>Load from URL</span>
              </Button>
            </div>
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}

function MainDialog(
  props: ImportDialogProps & {
    openUrlDialog: () => void;
  },
) {
  const systemInfo = useContext(SystemInfoContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Credenza open={true} onOpenChange={props.closer}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{props.title}</CredenzaTitle>
          <CredenzaDescription>{props.description}</CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="pb-4 md:pb-0">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              {!isTauri() && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={props.filters.map((f) => f.mimeType).join(',')}
                  multiple={props.allowMultiple}
                  className="hidden"
                  onChange={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (!target.files) {
                      return;
                    }

                    for (let i = 0; i < target.files.length; i++) {
                      const file = target.files.item(i);
                      if (!file) {
                        continue;
                      }

                      const reader = new FileReader();
                      reader.onload = () => {
                        const data = reader.result as string;
                        props.listener(data);
                      };
                      reader.readAsText(file);
                    }
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
                        filters: systemInfo?.mobile ? undefined : props.filters,
                        defaultPath: downloadsDir,
                        multiple: props.allowMultiple,
                        directory: false,
                      });
                      if (input === null) {
                        return;
                      }

                      const toParse: string[] = Array.isArray(input)
                        ? input
                        : [input];
                      for (const file of toParse) {
                        const data = await readTextFile(file);

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
                onClick={props.openUrlDialog}
              >
                <GlobeIcon className="w-4 h-4 mr-2" />
                <span>From URL</span>
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  void (async () => {
                    if (isTauri()) {
                      props.listener((await clipboard.readText()) ?? '');
                    } else {
                      const mimeTypes = props.filters.map((f) => f.mimeType);
                      const matcher = new MimeMatcher(...mimeTypes);
                      let clipboardEntries = (await navigator.clipboard.read())
                        .map((item) => ({
                          item,
                          firstSupportedType: item.types.find((t) =>
                            matcher.match(t),
                          ),
                        }))
                        .filter((e) => {
                          return e.firstSupportedType !== undefined;
                        });
                      if (!props.allowMultiple && clipboardEntries.length > 1) {
                        toast.warning(
                          'You had multiple items in the clipboard, only using first one.',
                        );
                        clipboardEntries = [clipboardEntries[0]];
                      }

                      for (const entry of clipboardEntries) {
                        const blob = await entry.item.getType(
                          entry.firstSupportedType!,
                        );
                        props.listener(await blob.text());
                      }
                    }
                  })();
                }}
              >
                <ClipboardIcon className="w-4 h-4 mr-2" />
                <span>From clipboard</span>
              </Button>
            </div>
            {props.textInput !== null && (
              <TextInput {...props} textInput={props.textInput} />
            )}
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}

function TextInput(
  props: Omit<ImportDialogProps, 'textInput'> & {
    textInput: TextInput;
  },
) {
  const [inputText, setInputText] = useState(props.textInput.defaultValue);
  return (
    <>
      <Separator orientation="horizontal" />
      <div className="flex flex-col gap-4">
        <Textarea
          autoFocus
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
    </>
  );
}
