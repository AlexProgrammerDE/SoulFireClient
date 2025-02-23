import { ClientDataResponse } from '@/generated/soulfire/config.ts';

export const demoData: ClientDataResponse = {
  id: 'f8030fa8-3be6-45c8-93f9-476ca39d42d5',
  username: 'root',
  role: 0,
  email: 'root@soulfiremc.com',
  serverPermissions: [
    { globalPermission: 0, granted: true },
    {
      globalPermission: 1,
      granted: true,
    },
    { globalPermission: 2, granted: true },
    { globalPermission: 3, granted: true },
    {
      globalPermission: 4,
      granted: true,
    },
    { globalPermission: 5, granted: true },
    { globalPermission: 6, granted: true },
    {
      globalPermission: 7,
      granted: true,
    },
    { globalPermission: 8, granted: true },
    { globalPermission: 11, granted: true },
    {
      globalPermission: 9,
      granted: true,
    },
    { globalPermission: 10, granted: true },
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
      description:
        'Pings the server list before connecting. (Bypasses anti-bots like EpicGuard)',
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
      id: 'chat-logger',
      version: '1.0.0',
      description:
        'Logs all received chat messages to the terminal\nIncludes deduplication to prevent spamming the same message too often',
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
      pageName: 'Server Settings',
      namespace: 'server',
      entries: [
        {
          key: 'public-address',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'Public address',
                description:
                  'The address clients on the internet use to connect to this SoulFire instance.\nUsed for links in E-Mails.',
                def: 'http://127.0.0.1:38765',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'allow-creating-instances',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Allow creating instances',
                description: 'Allow (non-admin) users to create instances.',
                def: true,
              },
            },
          },
        },
        {
          key: 'allow-deleting-instances',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Allow deleting instances',
                description: 'Allow the owner of an instance to delete it.',
                def: true,
              },
            },
          },
        },
        {
          key: 'allow-changing-instance-meta',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Allow changing instance meta',
                description:
                  'Allow the owner of an instance to change meta like instance name and icon.',
                def: true,
              },
            },
          },
        },
        {
          key: 'email-type',
          type: {
            value: {
              oneofKind: 'combo',
              combo: {
                uiName: 'Email Type',
                description: 'How emails should be delivered.',
                options: [
                  { id: 'CONSOLE', displayName: 'Console' },
                  { id: 'SMTP', displayName: 'SMTP' },
                ],
                def: 'CONSOLE',
              },
            },
          },
        },
        {
          key: 'smtp-host',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'SMTP Host',
                description: 'SMTP server host to use for sending emails.',
                def: 'smtp.gmail.com',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'smtp-port',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'SMTP Port',
                description: 'SMTP server port to use for sending emails.',
                def: 587,
                min: 1,
                max: 65535,
                step: 1,
                placeholder: '',
                thousandSeparator: true,
              },
            },
          },
        },
        {
          key: 'smtp-username',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'SMTP Username',
                description: 'Username to use for SMTP authentication.',
                def: '',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'smtp-password',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'SMTP Password',
                description: 'Password to use for SMTP authentication.',
                def: '',
                secret: true,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
        {
          key: 'smtp-type',
          type: {
            value: {
              oneofKind: 'combo',
              combo: {
                uiName: 'SMTP Type',
                description: 'Type of encryption to use for SMTP.',
                options: [
                  { id: 'STARTTLS', displayName: 'STARTTLS' },
                  {
                    id: 'SSL_TLS',
                    displayName: 'SSL/TLS',
                  },
                  { id: 'NONE', displayName: 'None' },
                ],
                def: 'STARTTLS',
              },
            },
          },
        },
        {
          key: 'smtp-from',
          type: {
            value: {
              oneofKind: 'string',
              string: {
                uiName: 'SMTP From',
                description: 'Email address to use as sender for emails.',
                def: 'soulfire@gmail.com',
                secret: false,
                textarea: false,
                placeholder: '',
              },
            },
          },
        },
      ],
      iconId: 'server',
    },
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
                thousandSeparator: true,
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
                min: 0,
                max: 2147483647,
                step: 1,
                thousandSeparator: true,
                minEntry: {
                  uiName: 'Min Join Delay (ms)',
                  description: 'Minimum delay between joins in milliseconds',
                  def: 1000,
                  placeholder: '',
                },
                maxEntry: {
                  uiName: 'Max Join Delay (ms)',
                  description: 'Maximum delay between joins in milliseconds',
                  def: 3000,
                  placeholder: '',
                },
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
                  { id: 'SPECIAL|766', displayName: 'Bedrock 1.21.50' },
                  {
                    id: 'RELEASE|769',
                    displayName: '1.21.4',
                  },
                  { id: 'RELEASE|768', displayName: '1.21.2-1.21.3' },
                  {
                    id: 'RELEASE|767',
                    displayName: '1.21-1.21.1',
                  },
                  { id: 'RELEASE|766', displayName: '1.20.5-1.20.6' },
                  {
                    id: 'RELEASE|765',
                    displayName: '1.20.3-1.20.4',
                  },
                  { id: 'RELEASE|764', displayName: '1.20.2' },
                  {
                    id: 'RELEASE|763',
                    displayName: '1.20-1.20.1',
                  },
                  { id: 'RELEASE|762', displayName: '1.19.4' },
                  {
                    id: 'RELEASE|761',
                    displayName: '1.19.3',
                  },
                  { id: 'RELEASE|760', displayName: '1.19.1-1.19.2' },
                  {
                    id: 'RELEASE|759',
                    displayName: '1.19',
                  },
                  { id: 'RELEASE|758', displayName: '1.18.2' },
                  {
                    id: 'RELEASE|757',
                    displayName: '1.18-1.18.1',
                  },
                  { id: 'RELEASE|756', displayName: '1.17.1' },
                  {
                    id: 'RELEASE|755',
                    displayName: '1.17',
                  },
                  { id: 'RELEASE|754', displayName: '1.16.4-1.16.5' },
                  {
                    id: 'RELEASE|753',
                    displayName: '1.16.3',
                  },
                  { id: 'RELEASE|751', displayName: '1.16.2' },
                  {
                    id: 'SPECIAL|803',
                    displayName: 'Combat Test 8c',
                  },
                  { id: 'RELEASE|736', displayName: '1.16.1' },
                  {
                    id: 'RELEASE|735',
                    displayName: '1.16',
                  },
                  { id: 'SPECIAL|709', displayName: '20w14infinite' },
                  {
                    id: 'RELEASE|578',
                    displayName: '1.15.2',
                  },
                  { id: 'RELEASE|575', displayName: '1.15.1' },
                  {
                    id: 'RELEASE|573',
                    displayName: '1.15',
                  },
                  { id: 'RELEASE|498', displayName: '1.14.4' },
                  {
                    id: 'RELEASE|490',
                    displayName: '1.14.3',
                  },
                  { id: 'RELEASE|485', displayName: '1.14.2' },
                  {
                    id: 'RELEASE|480',
                    displayName: '1.14.1',
                  },
                  { id: 'RELEASE|477', displayName: '1.14' },
                  {
                    id: 'SPECIAL|1',
                    displayName: '3D Shareware',
                  },
                  { id: 'RELEASE|404', displayName: '1.13.2' },
                  {
                    id: 'RELEASE|401',
                    displayName: '1.13.1',
                  },
                  { id: 'RELEASE|393', displayName: '1.13' },
                  {
                    id: 'RELEASE|340',
                    displayName: '1.12.2',
                  },
                  { id: 'RELEASE|338', displayName: '1.12.1' },
                  {
                    id: 'RELEASE|335',
                    displayName: '1.12',
                  },
                  { id: 'RELEASE|316', displayName: '1.11.1-1.11.2' },
                  {
                    id: 'RELEASE|315',
                    displayName: '1.11',
                  },
                  { id: 'RELEASE|210', displayName: '1.10.x' },
                  {
                    id: 'RELEASE|110',
                    displayName: '1.9.3-1.9.4',
                  },
                  { id: 'RELEASE|109', displayName: '1.9.2' },
                  {
                    id: 'RELEASE|108',
                    displayName: '1.9.1',
                  },
                  { id: 'RELEASE|107', displayName: '1.9' },
                  {
                    id: 'RELEASE|47',
                    displayName: '1.8.x',
                  },
                  { id: 'RELEASE|5', displayName: '1.7.6-1.7.10' },
                  {
                    id: 'RELEASE|4',
                    displayName: '1.7.2-1.7.5',
                  },
                  { id: 'RELEASE_INITIAL|78', displayName: '1.6.4' },
                  {
                    id: 'RELEASE_INITIAL|74',
                    displayName: '1.6.2',
                  },
                  { id: 'RELEASE_INITIAL|73', displayName: '1.6.1' },
                  {
                    id: 'RELEASE_INITIAL|61',
                    displayName: '1.5.2',
                  },
                  { id: 'RELEASE_INITIAL|60', displayName: '1.5-1.5.1' },
                  {
                    id: 'RELEASE_INITIAL|51',
                    displayName: '1.4.6-1.4.7',
                  },
                  { id: 'RELEASE_INITIAL|49', displayName: '1.4.4-1.4.5' },
                  {
                    id: 'RELEASE_INITIAL|47',
                    displayName: '1.4.2',
                  },
                  { id: 'RELEASE_INITIAL|39', displayName: '1.3.1-1.3.2' },
                  {
                    id: 'RELEASE_INITIAL|29',
                    displayName: '1.2.4-1.2.5',
                  },
                  { id: 'RELEASE_INITIAL|28', displayName: '1.2.1-1.2.3' },
                  {
                    id: 'RELEASE_INITIAL|23',
                    displayName: '1.1',
                  },
                  { id: 'RELEASE_INITIAL|22', displayName: '1.0.0-1.0.1' },
                  {
                    id: 'BETA_LATER|17',
                    displayName: 'b1.8-b1.8.1',
                  },
                  { id: 'BETA_LATER|14', displayName: 'b1.7-b1.7.3' },
                  {
                    id: 'BETA_LATER|13',
                    displayName: 'b1.6-b1.6.6',
                  },
                  { id: 'BETA_LATER|11', displayName: 'b1.5-b1.5.2' },
                  {
                    id: 'BETA_LATER|10',
                    displayName: 'b1.4-b1.4.1',
                  },
                  { id: 'BETA_LATER|9', displayName: 'b1.3-b1.3.1' },
                  {
                    id: 'BETA_LATER|8',
                    displayName: 'b1.2-b1.2.2',
                  },
                  { id: 'BETA_INITIAL|8', displayName: 'b1.1.2' },
                  {
                    id: 'BETA_INITIAL|7',
                    displayName: 'b1.0-b1.1.1',
                  },
                  { id: 'ALPHA_LATER|6', displayName: 'a1.2.3.5-a1.2.6' },
                  {
                    id: 'ALPHA_LATER|5',
                    displayName: 'a1.2.3-a1.2.3.4',
                  },
                  { id: 'ALPHA_LATER|4', displayName: 'a1.2.2' },
                  {
                    id: 'ALPHA_LATER|3',
                    displayName: 'a1.2.0-a1.2.1.1',
                  },
                  { id: 'ALPHA_LATER|2', displayName: 'a1.1.0-a1.1.2.1' },
                  {
                    id: 'ALPHA_LATER|1',
                    displayName: 'a1.0.17-a1.0.17.4',
                  },
                  { id: 'ALPHA_INITIAL|14', displayName: 'a1.0.16-a1.0.16.2' },
                  {
                    id: 'ALPHA_INITIAL|13',
                    displayName: 'a1.0.15',
                  },
                  { id: 'SPECIAL|7', displayName: 'c0.30 CPE' },
                  {
                    id: 'CLASSIC|7',
                    displayName: 'c0.28-c0.30',
                  },
                  { id: 'CLASSIC|6', displayName: 'c0.0.20a-c0.27' },
                  {
                    id: 'CLASSIC|5',
                    displayName: 'c0.0.19a-06',
                  },
                  { id: 'CLASSIC|4', displayName: 'c0.0.18a-02' },
                  {
                    id: 'CLASSIC|3',
                    displayName: 'c0.0.16a-02',
                  },
                  { id: 'CLASSIC|0', displayName: 'c0.0.15a-1' },
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
                thousandSeparator: true,
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
                thousandSeparator: true,
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
                thousandSeparator: true,
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
                thousandSeparator: true,
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
          key: 'use-proxies-for-account-auth',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Use proxies for account auth',
                description:
                  'Should the imported proxies be used to authenticate accounts? (Contact Microsoft login, input credentials, etc.)\nOtherwise the SF server will authenticate accounts directly.',
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
                thousandSeparator: true,
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
                thousandSeparator: true,
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
                  { id: 'IPIFY', displayName: 'IPIFY' },
                  { id: 'AWS', displayName: 'AWS' },
                ],
                def: 'IPIFY',
              },
            },
          },
        },
        {
          key: 'proxy-check-concurrency',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'Proxy check concurrency',
                description: 'Amount of proxies to check at the same time',
                def: 10,
                min: 1,
                max: 2147483647,
                step: 1,
                placeholder: '',
                thousandSeparator: true,
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
                thousandSeparator: true,
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
                thousandSeparator: true,
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
                min: 0,
                max: 2147483647,
                step: 1,
                thousandSeparator: true,
                minEntry: {
                  uiName: 'Min delay (seconds)',
                  description: 'Minimum delay between jumps',
                  def: 2,
                  placeholder: '',
                },
                maxEntry: {
                  uiName: 'Max delay (seconds)',
                  description: 'Maximum delay between jumps',
                  def: 5,
                  placeholder: '',
                },
              },
            },
          },
        },
      ],
      iconId: 'footprints',
      owningPlugin: 'auto-jump',
      enabledKey: 'enabled',
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
      enabledKey: 'enabled',
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
                thousandSeparator: true,
              },
            },
          },
        },
      ],
      iconId: 'bot-message-square',
      owningPlugin: 'ai-chat-bot',
      enabledKey: 'enabled',
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
                min: 0,
                max: 2147483647,
                step: 1,
                thousandSeparator: true,
                minEntry: {
                  uiName: 'Min delay (seconds)',
                  description: 'Minimum delay between reconnects',
                  def: 1,
                  placeholder: '',
                },
                maxEntry: {
                  uiName: 'Max delay (seconds)',
                  description: 'Maximum delay between reconnects',
                  def: 5,
                  placeholder: '',
                },
              },
            },
          },
        },
      ],
      iconId: 'refresh-ccw',
      owningPlugin: 'auto-reconnect',
      enabledKey: 'enabled',
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
                thousandSeparator: true,
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
                  { id: 'FULL', displayName: 'Full' },
                  {
                    id: 'SYSTEM',
                    displayName: 'System',
                  },
                  { id: 'HIDDEN', displayName: 'Hidden' },
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
                  { id: 'LEFT_HAND', displayName: 'Left Hand' },
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
                  { id: 'ALL', displayName: 'All' },
                  {
                    id: 'DECREASED',
                    displayName: 'Decreased',
                  },
                  { id: 'MINIMAL', displayName: 'Minimal' },
                ],
                def: 'ALL',
              },
            },
          },
        },
      ],
      iconId: 'settings-2',
      owningPlugin: 'client-settings',
      enabledKey: 'enabled',
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
      enabledKey: 'enabled',
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
      enabledKey: 'enabled',
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
                  'Whether to ping the server list before connecting.',
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
                min: 0,
                max: 2147483647,
                step: 1,
                thousandSeparator: true,
                minEntry: {
                  uiName: 'Min delay (seconds)',
                  description: 'Minimum delay between joining the server',
                  def: 1,
                  placeholder: '',
                },
                maxEntry: {
                  uiName: 'Max delay (seconds)',
                  description: 'Maximum delay between joining the server',
                  def: 3,
                  placeholder: '',
                },
              },
            },
          },
        },
      ],
      iconId: 'network',
      owningPlugin: 'server-list-bypass',
      enabledKey: 'enabled',
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
                min: 1,
                max: 2147483647,
                step: 1,
                thousandSeparator: true,
                minEntry: {
                  uiName: 'Min distance (blocks)',
                  description: 'Minimum distance to walk',
                  def: 10,
                  placeholder: '',
                },
                maxEntry: {
                  uiName: 'Max distance (blocks)',
                  description: 'Maximum distance to walk',
                  def: 30,
                  placeholder: '',
                },
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
                min: 0,
                max: 2147483647,
                step: 1,
                thousandSeparator: true,
                minEntry: {
                  uiName: 'Min delay (seconds)',
                  description: 'Minimum delay between moves',
                  def: 15,
                  placeholder: '',
                },
                maxEntry: {
                  uiName: 'Max delay (seconds)',
                  description: 'Maximum delay between moves',
                  def: 30,
                  placeholder: '',
                },
              },
            },
          },
        },
      ],
      iconId: 'activity',
      owningPlugin: 'anti-afk',
      enabledKey: 'enabled',
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
                min: 0,
                max: 2147483647,
                step: 1,
                thousandSeparator: true,
                minEntry: {
                  uiName: 'Min delay (seconds)',
                  description: 'Minimum delay between using totems',
                  def: 1,
                  placeholder: '',
                },
                maxEntry: {
                  uiName: 'Max delay (seconds)',
                  description: 'Maximum delay between using totems',
                  def: 2,
                  placeholder: '',
                },
              },
            },
          },
        },
      ],
      iconId: 'cross',
      owningPlugin: 'auto-totem',
      enabledKey: 'enabled',
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
                min: 0,
                max: 2147483647,
                step: 1,
                thousandSeparator: true,
                minEntry: {
                  uiName: 'Min delay (seconds)',
                  description: 'Minimum delay between eating',
                  def: 1,
                  placeholder: '',
                },
                maxEntry: {
                  uiName: 'Max delay (seconds)',
                  description: 'Maximum delay between eating',
                  def: 2,
                  placeholder: '',
                },
              },
            },
          },
        },
      ],
      iconId: 'drumstick',
      owningPlugin: 'auto-eat',
      enabledKey: 'enabled',
    },
    {
      pageName: 'Chat Logger',
      namespace: 'chat-logger',
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
        {
          key: 'deduplicate-amount',
          type: {
            value: {
              oneofKind: 'int',
              int: {
                uiName: 'Deduplicate amount',
                description:
                  'How often should the same message be logged before it will not be logged again? (within 5 seconds)',
                def: 1,
                min: 1,
                max: 2147483647,
                step: 1,
                placeholder: '',
                thousandSeparator: true,
              },
            },
          },
        },
      ],
      iconId: 'logs',
      owningPlugin: 'chat-logger',
      enabledKey: 'enabled',
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
                min: 0,
                max: 2147483647,
                step: 1,
                thousandSeparator: true,
                minEntry: {
                  uiName: 'Min delay (seconds)',
                  description: 'Minimum delay between putting on armor',
                  def: 1,
                  placeholder: '',
                },
                maxEntry: {
                  uiName: 'Max delay (seconds)',
                  description: 'Maximum delay between putting on armor',
                  def: 2,
                  placeholder: '',
                },
              },
            },
          },
        },
      ],
      iconId: 'shield',
      owningPlugin: 'auto-armor',
      enabledKey: 'enabled',
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
                thousandSeparator: true,
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
      enabledKey: 'enabled',
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
                min: 0,
                max: 2147483647,
                step: 1,
                thousandSeparator: true,
                minEntry: {
                  uiName: 'Min delay (seconds)',
                  description: 'Minimum delay between chat messages',
                  def: 2,
                  placeholder: '',
                },
                maxEntry: {
                  uiName: 'Max delay (seconds)',
                  description: 'Maximum delay between chat messages',
                  def: 5,
                  placeholder: '',
                },
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
      enabledKey: 'enabled',
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
                thousandSeparator: true,
                decimalScale: 2,
                fixedDecimalScale: true,
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
                thousandSeparator: true,
                decimalScale: 2,
                fixedDecimalScale: true,
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
                thousandSeparator: true,
                decimalScale: 2,
                fixedDecimalScale: true,
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
                min: 1,
                max: 20,
                step: 1,
                thousandSeparator: true,
                minEntry: {
                  uiName: 'Attack Delay Ticks Min',
                  description:
                    'Minimum tick delay between attacks on pre-1.9 versions',
                  def: 8,
                  placeholder: '',
                },
                maxEntry: {
                  uiName: 'Attack Delay Ticks Max',
                  description:
                    'Maximum tick delay between attacks on pre-1.9 versions',
                  def: 12,
                  placeholder: '',
                },
              },
            },
          },
        },
      ],
      iconId: 'skull',
      owningPlugin: 'kill-aura',
      enabledKey: 'enable',
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
                min: 0,
                max: 2147483647,
                step: 1,
                thousandSeparator: true,
                minEntry: {
                  uiName: 'Min delay (seconds)',
                  description: 'Minimum delay between respawns',
                  def: 1,
                  placeholder: '',
                },
                maxEntry: {
                  uiName: 'Max delay (seconds)',
                  description: 'Maximum delay between respawns',
                  def: 3,
                  placeholder: '',
                },
              },
            },
          },
        },
      ],
      iconId: 'repeat',
      owningPlugin: 'auto-respawn',
      enabledKey: 'enabled',
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
                thousandSeparator: false,
              },
            },
          },
        },
      ],
      iconId: 'globe',
      owningPlugin: 'fake-virtual-host',
      enabledKey: 'enabled',
    },
    {
      pageName: 'Forwarding Bypass',
      namespace: 'forwarding-bypass',
      entries: [
        {
          key: 'enabled',
          type: {
            value: {
              oneofKind: 'bool',
              bool: {
                uiName: 'Enable forwarding bypass',
                description: 'Enable the forwarding bypass',
                def: false,
              },
            },
          },
        },
        {
          key: 'forwarding-mode',
          type: {
            value: {
              oneofKind: 'combo',
              combo: {
                uiName: 'Forwarding mode',
                description: 'What type of forwarding to use',
                options: [
                  { id: 'LEGACY', displayName: 'Legacy' },
                  {
                    id: 'BUNGEE_GUARD',
                    displayName: 'BungeeGuard',
                  },
                  { id: 'MODERN', displayName: 'Modern' },
                  { id: 'SF_BYPASS', displayName: 'SoulFire Bypass' },
                ],
                def: 'LEGACY',
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
      enabledKey: 'enabled',
    },
  ],
};
