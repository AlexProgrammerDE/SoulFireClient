import { ClientDataResponse } from '@/generated/soulfire/config.ts';

export const demoData: ClientDataResponse = {
  id: 'f8030fa8-3be6-45c8-93f9-476ca39d42d5',
  username: 'root',
  email: 'root@soulfiremc.com',
  role: 0,
  serverPermissions: [
    {
      globalPermission: 0,
      granted: true,
    },
    {
      globalPermission: 1,
      granted: true,
    },
    {
      globalPermission: 2,
      granted: true,
    },
    {
      globalPermission: 3,
      granted: true,
    },
    {
      globalPermission: 4,
      granted: true,
    },
    {
      globalPermission: 5,
      granted: true,
    },
    {
      globalPermission: 6,
      granted: true,
    },
    {
      globalPermission: 7,
      granted: true,
    },
    {
      globalPermission: 8,
      granted: true,
    },
  ],
  plugins: [
    {
      id: 'auto-jump',
      version: '1.0.0',
      description: 'Automatically jumps randomly',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'client-brand',
      version: '1.0.0',
      description: 'Sends the client brand to the server',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'ai-chat-bot',
      version: '1.0.0',
      description: 'Allow players to chat with an AI',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'auto-reconnect',
      version: '1.0.0',
      description:
        'Automatically reconnects bots when they time out or are kicked',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'client-settings',
      version: '1.0.0',
      description: 'Sends client settings to the server',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'chat-control',
      version: '1.0.0',
      description: 'Control the bot with chat messages',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'auto-register',
      version: '1.0.0',
      description: 'Automatically registers bots on servers',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'server-list-bypass',
      version: '1.0.0',
      description: 'Bypasses server list anti-bots',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'anti-afk',
      version: '1.0.0',
      description:
        'Automatically moves x amount of blocks in a random direction to prevent being kicked for being AFK',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'auto-totem',
      version: '1.0.0',
      description: 'Automatically puts totems in the offhand slot',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'auto-eat',
      version: '1.0.0',
      description: 'Automatically eats food when hungry',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'auto-armor',
      version: '1.0.0',
      description: 'Automatically puts on the best armor',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'pov-server',
      version: '1.0.0',
      description:
        'A plugin that allows users to control bots from a first-person perspective.',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'auto-chat-message',
      version: '1.0.0',
      description: 'Automatically sends messages in a configured delay',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'kill-aura',
      version: '1.0.0',
      description: 'Automatically attacks entities',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'auto-respawn',
      version: '1.0.0',
      description: 'Automatically respawns after death',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'chat-message-logger',
      version: '1.0.0',
      description: 'Logs all received chat messages to the terminal',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'fake-virtual-host',
      version: '1.0.0',
      description: 'Fakes the virtual host',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'mod-loader-support',
      version: '1.0.0',
      description: 'Supports mod loaders like Forge',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
    {
      id: 'forwarding-bypass',
      version: '1.0.0',
      description: 'Allows bypassing proxy forwarding',
      author: 'AlexProgrammerDE',
      license: 'GPL-3.0',
      website: 'https://soulfiremc.com',
    },
  ],
  serverSettings: [
    {
      pageName: 'Dev Settings',
      namespace: 'dev',
      entries: [
        {
          key: 'core-debug',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Core debug',
                description: 'Enable core code debug logging',
                def: false,
              },
            },
          },
        },
        {
          key: 'via-debug',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Via debug',
                description: 'Enable Via* code debug logging',
                def: false,
              },
            },
          },
        },
        {
          key: 'netty-debug',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Netty debug',
                description: 'Enable Netty debug logging',
                def: false,
              },
            },
          },
        },
        {
          key: 'grpc-debug',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'gRPC debug',
                description: 'Enable gRPC debug logging',
                def: false,
              },
            },
          },
        },
        {
          key: 'mcprotocollib-debug',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'MCProtocolLib debug',
                description: 'Enable MCProtocolLib debug logging',
                def: false,
              },
            },
          },
        },
      ],
      iconId: 'bug',
    },
  ],
  instanceSettings: [
    {
      pageName: 'Bot Settings',
      namespace: 'bot',
      entries: [
        {
          key: 'address',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Address',
                description: 'Address to connect to',
                def: '127.0.0.1:25565',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'amount',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'Amount',
                description: 'Amount of bots to connect',
                def: 1,
                min: 1,
                max: 2147483647,
                step: 1,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'join-delay',
          type: {
            value: {
              oneofKind: 'minMax',
              minMax: {
                minUiName: 'Min Join Delay (ms)',
                maxUiName: 'Max Join Delay (ms)',
                minDescription: 'Minimum delay between joins in milliseconds',
                maxDescription: 'Maximum delay between joins in milliseconds',
                minDef: 1000,
                maxDef: 3000,
                min: 0,
                max: 2147483647,
                step: 1,
                minPlaceholder: '',
                maxPlaceholder: '',
              },
            },
          },
        },
        {
          key: 'protocol-version',
          type: {
            value: {
              oneofKind: 'combo',
              combo: {
                uiName: 'Protocol Version',
                description: 'Minecraft protocol version to use',
                options: [
                  {
                    id: 'SPECIAL|766',
                    displayName: 'Bedrock 1.21.50',
                  },
                  {
                    id: 'RELEASE|769',
                    displayName: '1.21.4',
                  },
                  {
                    id: 'RELEASE|768',
                    displayName: '1.21.2-1.21.3',
                  },
                  {
                    id: 'RELEASE|767',
                    displayName: '1.21-1.21.1',
                  },
                  {
                    id: 'RELEASE|766',
                    displayName: '1.20.5-1.20.6',
                  },
                  {
                    id: 'RELEASE|765',
                    displayName: '1.20.3-1.20.4',
                  },
                  {
                    id: 'RELEASE|764',
                    displayName: '1.20.2',
                  },
                  {
                    id: 'RELEASE|763',
                    displayName: '1.20-1.20.1',
                  },
                  {
                    id: 'RELEASE|762',
                    displayName: '1.19.4',
                  },
                  {
                    id: 'RELEASE|761',
                    displayName: '1.19.3',
                  },
                  {
                    id: 'RELEASE|760',
                    displayName: '1.19.1-1.19.2',
                  },
                  {
                    id: 'RELEASE|759',
                    displayName: '1.19',
                  },
                  {
                    id: 'RELEASE|758',
                    displayName: '1.18.2',
                  },
                  {
                    id: 'RELEASE|757',
                    displayName: '1.18-1.18.1',
                  },
                  {
                    id: 'RELEASE|756',
                    displayName: '1.17.1',
                  },
                  {
                    id: 'RELEASE|755',
                    displayName: '1.17',
                  },
                  {
                    id: 'RELEASE|754',
                    displayName: '1.16.4-1.16.5',
                  },
                  {
                    id: 'RELEASE|753',
                    displayName: '1.16.3',
                  },
                  {
                    id: 'RELEASE|751',
                    displayName: '1.16.2',
                  },
                  {
                    id: 'SPECIAL|803',
                    displayName: 'Combat Test 8c',
                  },
                  {
                    id: 'RELEASE|736',
                    displayName: '1.16.1',
                  },
                  {
                    id: 'RELEASE|735',
                    displayName: '1.16',
                  },
                  {
                    id: 'SPECIAL|709',
                    displayName: '20w14infinite',
                  },
                  {
                    id: 'RELEASE|578',
                    displayName: '1.15.2',
                  },
                  {
                    id: 'RELEASE|575',
                    displayName: '1.15.1',
                  },
                  {
                    id: 'RELEASE|573',
                    displayName: '1.15',
                  },
                  {
                    id: 'RELEASE|498',
                    displayName: '1.14.4',
                  },
                  {
                    id: 'RELEASE|490',
                    displayName: '1.14.3',
                  },
                  {
                    id: 'RELEASE|485',
                    displayName: '1.14.2',
                  },
                  {
                    id: 'RELEASE|480',
                    displayName: '1.14.1',
                  },
                  {
                    id: 'RELEASE|477',
                    displayName: '1.14',
                  },
                  {
                    id: 'SPECIAL|1',
                    displayName: '3D Shareware',
                  },
                  {
                    id: 'RELEASE|404',
                    displayName: '1.13.2',
                  },
                  {
                    id: 'RELEASE|401',
                    displayName: '1.13.1',
                  },
                  {
                    id: 'RELEASE|393',
                    displayName: '1.13',
                  },
                  {
                    id: 'RELEASE|340',
                    displayName: '1.12.2',
                  },
                  {
                    id: 'RELEASE|338',
                    displayName: '1.12.1',
                  },
                  {
                    id: 'RELEASE|335',
                    displayName: '1.12',
                  },
                  {
                    id: 'RELEASE|316',
                    displayName: '1.11.1-1.11.2',
                  },
                  {
                    id: 'RELEASE|315',
                    displayName: '1.11',
                  },
                  {
                    id: 'RELEASE|210',
                    displayName: '1.10.x',
                  },
                  {
                    id: 'RELEASE|110',
                    displayName: '1.9.3-1.9.4',
                  },
                  {
                    id: 'RELEASE|109',
                    displayName: '1.9.2',
                  },
                  {
                    id: 'RELEASE|108',
                    displayName: '1.9.1',
                  },
                  {
                    id: 'RELEASE|107',
                    displayName: '1.9',
                  },
                  {
                    id: 'RELEASE|47',
                    displayName: '1.8.x',
                  },
                  {
                    id: 'RELEASE|5',
                    displayName: '1.7.6-1.7.10',
                  },
                  {
                    id: 'RELEASE|4',
                    displayName: '1.7.2-1.7.5',
                  },
                  {
                    id: 'RELEASE_INITIAL|78',
                    displayName: '1.6.4',
                  },
                  {
                    id: 'RELEASE_INITIAL|74',
                    displayName: '1.6.2',
                  },
                  {
                    id: 'RELEASE_INITIAL|73',
                    displayName: '1.6.1',
                  },
                  {
                    id: 'RELEASE_INITIAL|61',
                    displayName: '1.5.2',
                  },
                  {
                    id: 'RELEASE_INITIAL|60',
                    displayName: '1.5-1.5.1',
                  },
                  {
                    id: 'RELEASE_INITIAL|51',
                    displayName: '1.4.6-1.4.7',
                  },
                  {
                    id: 'RELEASE_INITIAL|49',
                    displayName: '1.4.4-1.4.5',
                  },
                  {
                    id: 'RELEASE_INITIAL|47',
                    displayName: '1.4.2',
                  },
                  {
                    id: 'RELEASE_INITIAL|39',
                    displayName: '1.3.1-1.3.2',
                  },
                  {
                    id: 'RELEASE_INITIAL|29',
                    displayName: '1.2.4-1.2.5',
                  },
                  {
                    id: 'RELEASE_INITIAL|28',
                    displayName: '1.2.1-1.2.3',
                  },
                  {
                    id: 'RELEASE_INITIAL|23',
                    displayName: '1.1',
                  },
                  {
                    id: 'RELEASE_INITIAL|22',
                    displayName: '1.0.0-1.0.1',
                  },
                  {
                    id: 'BETA_LATER|17',
                    displayName: 'b1.8-b1.8.1',
                  },
                  {
                    id: 'BETA_LATER|14',
                    displayName: 'b1.7-b1.7.3',
                  },
                  {
                    id: 'BETA_LATER|13',
                    displayName: 'b1.6-b1.6.6',
                  },
                  {
                    id: 'BETA_LATER|11',
                    displayName: 'b1.5-b1.5.2',
                  },
                  {
                    id: 'BETA_LATER|10',
                    displayName: 'b1.4-b1.4.1',
                  },
                  {
                    id: 'BETA_LATER|9',
                    displayName: 'b1.3-b1.3.1',
                  },
                  {
                    id: 'BETA_LATER|8',
                    displayName: 'b1.2-b1.2.2',
                  },
                  {
                    id: 'BETA_INITIAL|8',
                    displayName: 'b1.1.2',
                  },
                  {
                    id: 'BETA_INITIAL|7',
                    displayName: 'b1.0-b1.1.1',
                  },
                  {
                    id: 'ALPHA_LATER|6',
                    displayName: 'a1.2.3.5-a1.2.6',
                  },
                  {
                    id: 'ALPHA_LATER|5',
                    displayName: 'a1.2.3-a1.2.3.4',
                  },
                  {
                    id: 'ALPHA_LATER|4',
                    displayName: 'a1.2.2',
                  },
                  {
                    id: 'ALPHA_LATER|3',
                    displayName: 'a1.2.0-a1.2.1.1',
                  },
                  {
                    id: 'ALPHA_LATER|2',
                    displayName: 'a1.1.0-a1.1.2.1',
                  },
                  {
                    id: 'ALPHA_LATER|1',
                    displayName: 'a1.0.17-a1.0.17.4',
                  },
                  {
                    id: 'ALPHA_INITIAL|14',
                    displayName: 'a1.0.16-a1.0.16.2',
                  },
                  {
                    id: 'ALPHA_INITIAL|13',
                    displayName: 'a1.0.15',
                  },
                  {
                    id: 'SPECIAL|7',
                    displayName: 'c0.30 CPE',
                  },
                  {
                    id: 'CLASSIC|7',
                    displayName: 'c0.28-c0.30',
                  },
                  {
                    id: 'CLASSIC|6',
                    displayName: 'c0.0.20a-c0.27',
                  },
                  {
                    id: 'CLASSIC|5',
                    displayName: 'c0.0.19a-06',
                  },
                  {
                    id: 'CLASSIC|4',
                    displayName: 'c0.0.18a-02',
                  },
                  {
                    id: 'CLASSIC|3',
                    displayName: 'c0.0.16a-02',
                  },
                  {
                    id: 'CLASSIC|0',
                    displayName: 'c0.0.15a-1',
                  },
                ],
                def: 'RELEASE|769',
              },
            },
          },
        },
        {
          key: 'read-timeout',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'Read Timeout',
                description: 'Read timeout in seconds',
                def: 30,
                min: 0,
                max: 2147483647,
                step: 1,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'write-timeout',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'Write Timeout',
                description: 'Write timeout in seconds',
                def: 0,
                min: 0,
                max: 2147483647,
                step: 1,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'connect-timeout',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'Connect Timeout',
                description: 'Connect timeout in seconds',
                def: 30,
                min: 0,
                max: 2147483647,
                step: 1,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'resolve-srv',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Resolve SRV',
                description: 'Try to resolve SRV records from the address',
                def: true,
              },
            },
          },
        },
        {
          key: 'concurrent-connects',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'Concurrent Connects',
                description: 'Max amount of bots attempting to connect at once',
                def: 1,
                min: 1,
                max: 2147483647,
                step: 1,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'restore-on-reboot',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Restore on Reboot',
                description:
                  'Whether the attack should be restored after a reboot of the SoulFire machine.\nIf turned off, the attack will not be restored after a reboot.',
                def: true,
              },
            },
          },
        },
      ],
      iconId: 'bot',
    },
    {
      pageName: 'Account Settings',
      namespace: 'account',
      entries: [
        {
          key: 'name-format',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Name format',
                description:
                  'The format of the bot names. %d will be replaced with the bot number.',
                def: 'Bot_%d',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'shuffle-accounts',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Shuffle accounts',
                description:
                  'Should the accounts order be random when connecting bots?',
                def: false,
              },
            },
          },
        },
        {
          key: 'use-proxies-for-account-import',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Use proxies for account import',
                description:
                  'Should the imported proxies be used to import accounts? (Contact Microsoft login, input credentials, etc.)\nOtherwise the SF server will import accounts directly.',
                def: false,
              },
            },
          },
        },
        {
          key: 'account-import-concurrency',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'Account import concurrency',
                description:
                  'For credentials-like auth, how many accounts should be imported at once?',
                def: 3,
                min: 1,
                max: 2147483647,
                step: 1,
                placeholder: '',
              },
            },
          },
        },
      ],
      iconId: 'users',
    },
    {
      pageName: 'Proxy Settings',
      namespace: 'proxy',
      entries: [
        {
          key: 'bots-per-proxy',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'Bots per proxy',
                description: 'Amount of bots that can be on a single proxy',
                def: -1,
                min: -1,
                max: 2147483647,
                step: 1,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'shuffle-proxies',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Shuffle proxies',
                description:
                  'Should the proxy order be random when connecting bots?',
                def: false,
              },
            },
          },
        },
        {
          key: 'proxy-check-service',
          type: {
            value: {
              oneofKind: 'combo',
              combo: {
                uiName: 'Proxy check service',
                description:
                  'What service to use to check if a proxy is working',
                options: [
                  {
                    id: 'IPIFY',
                    displayName: 'IPIFY',
                  },
                  {
                    id: 'AWS',
                    displayName: 'AWS',
                  },
                ],
                def: 'IPIFY',
              },
            },
          },
        },
      ],
      iconId: 'waypoints',
    },
    {
      pageName: 'AI Settings',
      namespace: 'ai',
      entries: [
        {
          key: 'api-base-url',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'API Base URL',
                description:
                  'API server base URL, can also be changed to other providers',
                def: 'https://api.openai.com/v1',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'api-key',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'API Key',
                description: 'API key or none if using a custom provider',
                def: '',
                secret: true,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'api-request-timeout',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'API Request Timeout',
                description: 'API request timeout (seconds)',
                def: 60,
                min: 0,
                max: 2147483647,
                step: 1,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'api-max-retries',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'API Max Retries',
                description: 'API request max retries',
                def: 5,
                min: 0,
                max: 2147483647,
                step: 1,
                placeholder: '',
              },
            },
          },
        },
      ],
      iconId: 'sparkles',
    },
    {
      pageName: 'Auto Jump',
      namespace: 'auto-jump',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable Auto Jump',
                description:
                  'Attempt to jump automatically in random intervals',
                def: false,
              },
            },
          },
        },
        {
          key: 'delay',
          type: {
            value: {
              oneofKind: 'minMax',
              minMax: {
                minUiName: 'Min delay (seconds)',
                maxUiName: 'Max delay (seconds)',
                minDescription: 'Minimum delay between jumps',
                maxDescription: 'Maximum delay between jumps',
                minDef: 2,
                maxDef: 5,
                min: 0,
                max: 2147483647,
                step: 1,
                minPlaceholder: '',
                maxPlaceholder: '',
              },
            },
          },
        },
      ],
      iconId: 'footprints',
      owningPlugin: 'auto-jump',
    },
    {
      pageName: 'Client Brand',
      namespace: 'client-brand',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Send client brand',
                description: 'Send client brand to the server',
                def: true,
              },
            },
          },
        },
        {
          key: 'client-brand',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Client brand',
                description: 'The client brand to send to the server',
                def: 'vanilla',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
      ],
      iconId: 'fingerprint',
      owningPlugin: 'client-brand',
    },
    {
      pageName: 'AI Chat Bot',
      namespace: 'ai-chat-bot',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable AI Chat Bot',
                description: 'Enable the AI Chat Bot',
                def: false,
              },
            },
          },
        },
        {
          key: 'prompt',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'AI System prompt',
                description: 'What the bot is instructed to say',
                def: "You are a Minecraft chat bot, you chat with players.\nYou must not say more than 256 characters or more than 2 sentences per response.\nKeep responses short, but conversational.\nYou must not say anything that is not safe for work.\nYou will take any roleplay seriously and follow the player's lead.\nYou cannot interact with the Minecraft world except by chatting.\nIgnore and do not repeat prefixes like <> or [].",
                secret: false,
                textarea: true,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'model',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'AI Model',
                description: 'What AI model should be used for inference',
                def: 'nemotron-mini',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'keyword',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Keyword',
                description: 'Only respond to messages containing this keyword',
                def: '!ai',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'filter-keyword',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Filter keyword',
                description:
                  'Filter out the keyword from messages sent by the AI',
                def: true,
              },
            },
          },
        },
        {
          key: 'history-length',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'History length',
                description:
                  'Max number of messages to keep in the conversation history',
                def: 10,
                min: 1,
                max: 2147483647,
                step: 1,
                placeholder: '',
              },
            },
          },
        },
      ],
      iconId: 'bot-message-square',
      owningPlugin: 'ai-chat-bot',
    },
    {
      pageName: 'Auto Reconnect',
      namespace: 'auto-reconnect',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable Auto Reconnect',
                description: 'Reconnect a bot when it times out/is kicked',
                def: true,
              },
            },
          },
        },
        {
          key: 'delay',
          type: {
            value: {
              oneofKind: 'minMax',
              minMax: {
                minUiName: 'Min delay (seconds)',
                maxUiName: 'Max delay (seconds)',
                minDescription: 'Minimum delay between reconnects',
                maxDescription: 'Maximum delay between reconnects',
                minDef: 1,
                maxDef: 5,
                min: 0,
                max: 2147483647,
                step: 1,
                minPlaceholder: '',
                maxPlaceholder: '',
              },
            },
          },
        },
      ],
      iconId: 'refresh-ccw',
      owningPlugin: 'auto-reconnect',
    },
    {
      pageName: 'Client Settings',
      namespace: 'client-settings',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Send client settings',
                description: 'Send client settings to the server when joining',
                def: true,
              },
            },
          },
        },
        {
          key: 'client-locale',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Client locale',
                description: 'The locale the client uses for translations',
                def: 'en_gb',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'render-distance',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'Render distance',
                description:
                  'How far the client renders chunks. (Use this to load more or less chunks from the server)',
                def: 8,
                min: 2,
                max: 32,
                step: 1,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'chat-visibility',
          type: {
            value: {
              oneofKind: 'combo',
              combo: {
                uiName: 'Chat visibility',
                description:
                  'What type of chat messages the client will receive',
                options: [
                  {
                    id: 'FULL',
                    displayName: 'Full',
                  },
                  {
                    id: 'SYSTEM',
                    displayName: 'System',
                  },
                  {
                    id: 'HIDDEN',
                    displayName: 'Hidden',
                  },
                ],
                def: 'FULL',
              },
            },
          },
        },
        {
          key: 'use-chat-colors',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Use chat colors',
                description: 'Whether the client will use chat colors',
                def: true,
              },
            },
          },
        },
        {
          key: 'cape-enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Cape enabled',
                description: 'Whether to display the bots cape if it has one',
                def: true,
              },
            },
          },
        },
        {
          key: 'jacket-enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Jacket enabled',
                description: 'Whether to render the jacket overlay skin layer',
                def: true,
              },
            },
          },
        },
        {
          key: 'left-sleeve-enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Left sleeve enabled',
                description: 'Whether to render the left overlay skin layer',
                def: true,
              },
            },
          },
        },
        {
          key: 'right-sleeve-enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Right sleeve enabled',
                description: 'Whether to render the right overlay skin layer',
                def: true,
              },
            },
          },
        },
        {
          key: 'left-pants-leg-enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Left pants leg enabled',
                description:
                  'Whether to render the left pants leg overlay skin layer',
                def: true,
              },
            },
          },
        },
        {
          key: 'right-pants-leg-enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Right pants leg enabled',
                description:
                  'Whether to render the right pants leg overlay skin layer',
                def: true,
              },
            },
          },
        },
        {
          key: 'hat-enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Hat enabled',
                description: 'Whether to render the hat overlay skin layer',
                def: true,
              },
            },
          },
        },
        {
          key: 'hand-preference',
          type: {
            value: {
              oneofKind: 'combo',
              combo: {
                uiName: 'Hand preference',
                description: 'What hand the client prefers to use for items',
                options: [
                  {
                    id: 'LEFT_HAND',
                    displayName: 'Left Hand',
                  },
                  {
                    id: 'RIGHT_HAND',
                    displayName: 'Right Hand',
                  },
                ],
                def: 'RIGHT_HAND',
              },
            },
          },
        },
        {
          key: 'text-filtering-enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Text filtering enabled',
                description: 'Whether to filter chat messages from the server',
                def: true,
              },
            },
          },
        },
        {
          key: 'allows-listing',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Allows listing',
                description:
                  'Whether the client wants their username to be shown in the server list',
                def: true,
              },
            },
          },
        },
        {
          key: 'particle-status',
          type: {
            value: {
              oneofKind: 'combo',
              combo: {
                uiName: 'Particle Status',
                description: 'How many particles the client will render',
                options: [
                  {
                    id: 'ALL',
                    displayName: 'All',
                  },
                  {
                    id: 'DECREASED',
                    displayName: 'Decreased',
                  },
                  {
                    id: 'MINIMAL',
                    displayName: 'Minimal',
                  },
                ],
                def: 'ALL',
              },
            },
          },
        },
      ],
      iconId: 'settings-2',
      owningPlugin: 'client-settings',
    },
    {
      pageName: 'Chat Control',
      namespace: 'chat-control',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable Chat Control',
                description: 'Enable controlling the bot with chat messages',
                def: false,
              },
            },
          },
        },
        {
          key: 'command-prefix',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Command Prefix',
                description:
                  'Word to put before a command to make the bot execute it',
                def: '$',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
      ],
      iconId: 'joystick',
      owningPlugin: 'chat-control',
    },
    {
      pageName: 'Auto Register',
      namespace: 'auto-register',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable Auto Register',
                description:
                  'Make bots run the /register and /login command after joining',
                def: false,
              },
            },
          },
        },
        {
          key: 'register-command',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Register Command',
                description: 'Command to be executed to register',
                def: '/register %password% %password%',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'login-command',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Login Command',
                description: 'Command to be executed to log in',
                def: '/login %password%',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'captcha-command',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Captcha Command',
                description: 'Command to be executed to confirm a captcha',
                def: '/captcha %captcha%',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'password-format',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Password Format',
                description: 'The password for registering',
                def: 'SoulFire',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
      ],
      iconId: 'key-round',
      owningPlugin: 'auto-register',
    },
    {
      pageName: 'Server List Bypass',
      namespace: 'server-list-bypass',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable Server List Bypass',
                description:
                  'Whether to ping the server list before connecting. (Bypasses anti-bots like EpicGuard)',
                def: false,
              },
            },
          },
        },
        {
          key: 'delay',
          type: {
            value: {
              oneofKind: 'minMax',
              minMax: {
                minUiName: 'Min delay (seconds)',
                maxUiName: 'Max delay (seconds)',
                minDescription: 'Minimum delay between joining the server',
                maxDescription: 'Maximum delay between joining the server',
                minDef: 1,
                maxDef: 3,
                min: 0,
                max: 2147483647,
                step: 1,
                minPlaceholder: '',
                maxPlaceholder: '',
              },
            },
          },
        },
      ],
      iconId: 'network',
      owningPlugin: 'server-list-bypass',
    },
    {
      pageName: 'Anti AFK',
      namespace: 'anti-afk',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable Anti AFK',
                description: 'Enable the Anti AFK feature',
                def: false,
              },
            },
          },
        },
        {
          key: 'distance',
          type: {
            value: {
              oneofKind: 'minMax',
              minMax: {
                minUiName: 'Min distance (blocks)',
                maxUiName: 'Max distance (blocks)',
                minDescription: 'Minimum distance to walk',
                maxDescription: 'Maximum distance to walk',
                minDef: 10,
                maxDef: 30,
                min: 1,
                max: 2147483647,
                step: 1,
                minPlaceholder: '',
                maxPlaceholder: '',
              },
            },
          },
        },
        {
          key: 'delay',
          type: {
            value: {
              oneofKind: 'minMax',
              minMax: {
                minUiName: 'Min delay (seconds)',
                maxUiName: 'Max delay (seconds)',
                minDescription: 'Minimum delay between moves',
                maxDescription: 'Maximum delay between moves',
                minDef: 15,
                maxDef: 30,
                min: 0,
                max: 2147483647,
                step: 1,
                minPlaceholder: '',
                maxPlaceholder: '',
              },
            },
          },
        },
      ],
      iconId: 'activity',
      owningPlugin: 'anti-afk',
    },
    {
      pageName: 'Auto Totem',
      namespace: 'auto-totem',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable Auto Totem',
                description: 'Always put available totems in the offhand slot',
                def: true,
              },
            },
          },
        },
        {
          key: 'delay',
          type: {
            value: {
              oneofKind: 'minMax',
              minMax: {
                minUiName: 'Min delay (seconds)',
                maxUiName: 'Max delay (seconds)',
                minDescription: 'Minimum delay between using totems',
                maxDescription: 'Maximum delay between using totems',
                minDef: 1,
                maxDef: 2,
                min: 0,
                max: 2147483647,
                step: 1,
                minPlaceholder: '',
                maxPlaceholder: '',
              },
            },
          },
        },
      ],
      iconId: 'cross',
      owningPlugin: 'auto-totem',
    },
    {
      pageName: 'Auto Eat',
      namespace: 'auto-eat',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable Auto Eat',
                description: 'Eat available food automatically when hungry',
                def: true,
              },
            },
          },
        },
        {
          key: 'delay',
          type: {
            value: {
              oneofKind: 'minMax',
              minMax: {
                minUiName: 'Min delay (seconds)',
                maxUiName: 'Max delay (seconds)',
                minDescription: 'Minimum delay between eating',
                maxDescription: 'Maximum delay between eating',
                minDef: 1,
                maxDef: 2,
                min: 0,
                max: 2147483647,
                step: 1,
                minPlaceholder: '',
                maxPlaceholder: '',
              },
            },
          },
        },
      ],
      iconId: 'drumstick',
      owningPlugin: 'auto-eat',
    },
    {
      pageName: 'Auto Armor',
      namespace: 'auto-armor',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable Auto Armor',
                description: 'Put on best armor automatically',
                def: true,
              },
            },
          },
        },
        {
          key: 'delay',
          type: {
            value: {
              oneofKind: 'minMax',
              minMax: {
                minUiName: 'Min delay (seconds)',
                maxUiName: 'Max delay (seconds)',
                minDescription: 'Minimum delay between putting on armor',
                maxDescription: 'Maximum delay between putting on armor',
                minDef: 1,
                maxDef: 2,
                min: 0,
                max: 2147483647,
                step: 1,
                minPlaceholder: '',
                maxPlaceholder: '',
              },
            },
          },
        },
      ],
      iconId: 'shield',
      owningPlugin: 'auto-armor',
    },
    {
      pageName: 'POV Server',
      namespace: 'pov-server',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable POV server',
                description: 'Host a POV server for the bots',
                def: false,
              },
            },
          },
        },
        {
          key: 'port-start',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'Port Start',
                description: 'What port to start with to host the POV server',
                def: 31765,
                min: 1,
                max: 65535,
                step: 1,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'enable-commands',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable commands',
                description:
                  'Allow users connected to the POV server to execute commands in the SF server shell',
                def: true,
              },
            },
          },
        },
        {
          key: 'command-prefix',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Command Prefix',
                description:
                  'The prefix to use for commands executed in the SF server shell',
                def: '#',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
      ],
      iconId: 'view',
      owningPlugin: 'pov-server',
    },
    {
      pageName: 'Auto Chat Message',
      namespace: 'auto-chat-message',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable Auto Chat Message',
                description:
                  'Attempt to send chat messages automatically in random intervals',
                def: false,
              },
            },
          },
        },
        {
          key: 'delay',
          type: {
            value: {
              oneofKind: 'minMax',
              minMax: {
                minUiName: 'Min delay (seconds)',
                maxUiName: 'Max delay (seconds)',
                minDescription: 'Minimum delay between chat messages',
                maxDescription: 'Maximum delay between chat messages',
                minDef: 2,
                maxDef: 5,
                min: 0,
                max: 2147483647,
                step: 1,
                minPlaceholder: '',
                maxPlaceholder: '',
              },
            },
          },
        },
        {
          key: 'messages',
          type: {
            value: {
              oneofKind: 'stringList',
              stringList: {
                uiName: 'Chat Messages',
                description: 'List of chat messages to send',
                def: ['Hello', 'Hi', 'Hey', 'How are you?'],
              },
            },
          },
        },
      ],
      iconId: 'message-circle-code',
      owningPlugin: 'auto-chat-message',
    },
    {
      pageName: 'Kill Aura',
      namespace: 'kill-aura',
      entries: [
        {
          key: 'enable',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable',
                description: 'Enable KillAura',
                def: false,
              },
            },
          },
        },
        {
          key: 'whitelisted-user',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Whitelisted User',
                description: 'This user will be ignored by the kill aura',
                def: 'Pansexuel',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'hit-range',
          type: {
            value: {
              oneofKind: 'double',
              double: {
                uiName: 'Hit Range',
                description:
                  'Range for the kill aura where the bot will start hitting the entity',
                def: 3,
                min: 0.5,
                max: 6,
                step: 0.1,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'swing-range',
          type: {
            value: {
              oneofKind: 'double',
              double: {
                uiName: 'Swing Range',
                description:
                  'Range for the kill aura where the bot will start swinging arm, set to 0 to disable',
                def: 3.5,
                min: 0,
                max: 10,
                step: 0.1,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'look-range',
          type: {
            value: {
              oneofKind: 'double',
              double: {
                uiName: 'Look Range',
                description:
                  'Range for the kill aura where the bot will start looking at the entity, set to 0 to disable',
                def: 4.8,
                min: 0,
                max: 25,
                step: 0.1,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'check-walls',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Check Walls',
                description: 'Check if the entity is behind a wall',
                def: true,
              },
            },
          },
        },
        {
          key: 'ignore-cooldown',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Ignore Cooldown',
                description:
                  'Ignore the 1.9+ attack cooldown to act like a 1.8 kill aura',
                def: false,
              },
            },
          },
        },
        {
          key: 'attack-delay-ticks',
          type: {
            value: {
              oneofKind: 'minMax',
              minMax: {
                minUiName: 'Attack Delay Ticks Min',
                maxUiName: 'Attack Delay Ticks Max',
                minDescription:
                  'Minimum tick delay between attacks on pre-1.9 versions',
                maxDescription:
                  'Maximum tick delay between attacks on pre-1.9 versions',
                minDef: 8,
                maxDef: 12,
                min: 1,
                max: 20,
                step: 1,
                minPlaceholder: '',
                maxPlaceholder: '',
              },
            },
          },
        },
      ],
      iconId: 'skull',
      owningPlugin: 'kill-aura',
    },
    {
      pageName: 'Auto Respawn',
      namespace: 'auto-respawn',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable Auto Respawn',
                description: 'Respawn automatically after death',
                def: true,
              },
            },
          },
        },
        {
          key: 'delay',
          type: {
            value: {
              oneofKind: 'minMax',
              minMax: {
                minUiName: 'Min delay (seconds)',
                maxUiName: 'Max delay (seconds)',
                minDescription: 'Minimum delay between respawns',
                maxDescription: 'Maximum delay between respawns',
                minDef: 1,
                maxDef: 3,
                min: 0,
                max: 2147483647,
                step: 1,
                minPlaceholder: '',
                maxPlaceholder: '',
              },
            },
          },
        },
      ],
      iconId: 'repeat',
      owningPlugin: 'auto-respawn',
    },
    {
      pageName: 'Chat Message Logger',
      namespace: 'chat-message-logger',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Log chat to terminal',
                description: 'Log all received chat messages to the terminal',
                def: true,
              },
            },
          },
        },
      ],
      iconId: 'logs',
      owningPlugin: 'chat-message-logger',
    },
    {
      pageName: 'Fake Virtual Host',
      namespace: 'fake-virtual-host',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Fake virtual host',
                description: 'Whether to fake the virtual host or not',
                def: false,
              },
            },
          },
        },
        {
          key: 'hostname',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Hostname',
                description: 'The hostname to fake',
                def: 'localhost',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'port',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'Port',
                description: 'The port to fake',
                def: 25565,
                min: 1,
                max: 65535,
                step: 1,
                placeholder: '',
                format: '#',
              },
            },
          },
        },
      ],
      iconId: 'globe',
      owningPlugin: 'fake-virtual-host',
    },
    {
      pageName: 'Forwarding Bypass',
      namespace: 'forwarding-bypass',
      entries: [
        {
          key: 'forwarding-mode',
          type: {
            value: {
              oneofKind: 'combo',
              combo: {
                uiName: 'Forwarding mode',
                description: 'What type of forwarding to use',
                options: [
                  {
                    id: 'NONE',
                    displayName: 'None',
                  },
                  {
                    id: 'LEGACY',
                    displayName: 'Legacy',
                  },
                  {
                    id: 'BUNGEE_GUARD',
                    displayName: 'BungeeGuard',
                  },
                  {
                    id: 'MODERN',
                    displayName: 'Modern',
                  },
                  {
                    id: 'SF_BYPASS',
                    displayName: 'SoulFire Bypass',
                  },
                ],
                def: 'NONE',
              },
            },
          },
        },
        {
          key: 'secret',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Secret',
                description:
                  'Secret key used for forwarding. (Not needed for legacy mode)',
                def: 'forwarding secret',
                secret: true,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
      ],
      iconId: 'milestone',
      owningPlugin: 'forwarding-bypass',
    },
  ],
};
