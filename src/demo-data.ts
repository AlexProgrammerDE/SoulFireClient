import type { ClientDataResponse } from "@/generated/soulfire/client.ts";
import {
  GlobalPermission,
  type SettingsPage,
} from "@/generated/soulfire/common.ts";
import { smartEntries } from "@/lib/utils.tsx";

export const demoClientData: ClientDataResponse = {
  id: "00000000-0000-0000-0000-000000000000",
  username: "root",
  role: 0,
  email: "root@soulfiremc.com",
  serverPermissions: smartEntries(GlobalPermission).map((permission) => ({
    globalPermission: permission[1],
    granted: true,
  })),
  serverInfo: {
    version: "DEMO",
    commitHash: "DEMO",
    branchName: "DEMO",
    publicApiAddress: "https://demo.soulfiremc.com",
    publicWebdavAddress: "https://demo.soulfiremc.com/webdav",
    publicDocsAddress: "https://demo.soulfiremc.com/docs",
  },
};

export const demoInstanceSettings: SettingsPage[] = [
  {
    pageName: "Bot Settings",
    namespace: "bot",
    entries: [
      {
        key: "address",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Address",
            description: "Address to connect to",
            def: "127.0.0.1:25565",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "amount",
        value: {
          oneofKind: "int",
          int: {
            uiName: "Amount",
            description: "Amount of bots to connect",
            def: 1,
            min: 1,
            max: 2147483647,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
      {
        key: "join-delay",
        value: {
          oneofKind: "minMax",
          minMax: {
            min: 0,
            max: 2147483647,
            step: 1,
            thousandSeparator: true,
            disabled: false,
            minEntry: {
              uiName: "Min Join Delay (ms)",
              description: "Minimum delay between joins in milliseconds",
              def: 1000,
              placeholder: "",
            },
            maxEntry: {
              uiName: "Max Join Delay (ms)",
              description: "Maximum delay between joins in milliseconds",
              def: 3000,
              placeholder: "",
            },
          },
        },
      },
      {
        key: "protocol-version",
        value: {
          oneofKind: "combo",
          combo: {
            uiName: "Protocol Version",
            description: "Minecraft protocol version to use",
            options: [
              {
                id: "SPECIAL|827",
                displayName: "Bedrock 1.21.100 (Work in progress)",
                keywords: ["Bedrock 1.21.100", "827"],
                iconId: "brick-wall",
              },
              {
                id: "RELEASE|772",
                displayName: "1.21.7-1.21.8",
                keywords: ["1.21.7", "1.21.8", "772"],
                iconId: "box",
              },
              {
                id: "RELEASE|771",
                displayName: "1.21.6",
                keywords: ["1.21.6", "771"],
                iconId: "box",
              },
              {
                id: "SPECIAL|1073742068",
                displayName: "25w14craftmine",
                keywords: ["25w14craftmine", "1073742068"],
                iconId: "ghost",
              },
              {
                id: "RELEASE|770",
                displayName: "1.21.5",
                keywords: ["1.21.5", "770"],
                iconId: "box",
              },
              {
                id: "RELEASE|769",
                displayName: "1.21.4",
                keywords: ["1.21.4", "769"],
                iconId: "box",
              },
              {
                id: "RELEASE|768",
                displayName: "1.21.2-1.21.3",
                keywords: ["1.21.2", "1.21.3", "768"],
                iconId: "box",
              },
              {
                id: "RELEASE|767",
                displayName: "1.21-1.21.1",
                keywords: ["1.21", "1.21.0", "1.21.1", "767"],
                iconId: "box",
              },
              {
                id: "RELEASE|766",
                displayName: "1.20.5-1.20.6",
                keywords: ["1.20.5", "1.20.6", "766"],
                iconId: "box",
              },
              {
                id: "RELEASE|765",
                displayName: "1.20.3-1.20.4",
                keywords: ["1.20.3", "1.20.4", "765"],
                iconId: "box",
              },
              {
                id: "RELEASE|764",
                displayName: "1.20.2",
                keywords: ["1.20.2", "764"],
                iconId: "box",
              },
              {
                id: "RELEASE|763",
                displayName: "1.20-1.20.1",
                keywords: ["1.20", "1.20.0", "1.20.1", "763"],
                iconId: "box",
              },
              {
                id: "RELEASE|762",
                displayName: "1.19.4",
                keywords: ["1.19.4", "762"],
                iconId: "box",
              },
              {
                id: "RELEASE|761",
                displayName: "1.19.3",
                keywords: ["1.19.3", "761"],
                iconId: "box",
              },
              {
                id: "RELEASE|760",
                displayName: "1.19.1-1.19.2",
                keywords: ["1.19.1", "1.19.2", "760"],
                iconId: "box",
              },
              {
                id: "RELEASE|759",
                displayName: "1.19",
                keywords: ["1.19", "759"],
                iconId: "box",
              },
              {
                id: "RELEASE|758",
                displayName: "1.18.2",
                keywords: ["1.18.2", "758"],
                iconId: "box",
              },
              {
                id: "RELEASE|757",
                displayName: "1.18-1.18.1",
                keywords: ["1.18", "1.18.0", "1.18.1", "757"],
                iconId: "box",
              },
              {
                id: "RELEASE|756",
                displayName: "1.17.1",
                keywords: ["1.17.1", "756"],
                iconId: "box",
              },
              {
                id: "RELEASE|755",
                displayName: "1.17",
                keywords: ["1.17", "755"],
                iconId: "box",
              },
              {
                id: "RELEASE|754",
                displayName: "1.16.4-1.16.5",
                keywords: ["1.16.4", "1.16.5", "754"],
                iconId: "box",
              },
              {
                id: "RELEASE|753",
                displayName: "1.16.3",
                keywords: ["1.16.3", "753"],
                iconId: "box",
              },
              {
                id: "RELEASE|751",
                displayName: "1.16.2",
                keywords: ["1.16.2", "751"],
                iconId: "box",
              },
              {
                id: "SPECIAL|803",
                displayName: "Combat Test 8c",
                keywords: ["Combat Test 8c", "803"],
                iconId: "ghost",
              },
              {
                id: "RELEASE|736",
                displayName: "1.16.1",
                keywords: ["1.16.1", "736"],
                iconId: "box",
              },
              {
                id: "RELEASE|735",
                displayName: "1.16",
                keywords: ["1.16", "735"],
                iconId: "box",
              },
              {
                id: "SPECIAL|709",
                displayName: "20w14infinite",
                keywords: ["20w14infinite", "709"],
                iconId: "ghost",
              },
              {
                id: "RELEASE|578",
                displayName: "1.15.2",
                keywords: ["1.15.2", "578"],
                iconId: "box",
              },
              {
                id: "RELEASE|575",
                displayName: "1.15.1",
                keywords: ["1.15.1", "575"],
                iconId: "box",
              },
              {
                id: "RELEASE|573",
                displayName: "1.15",
                keywords: ["1.15", "573"],
                iconId: "box",
              },
              {
                id: "RELEASE|498",
                displayName: "1.14.4",
                keywords: ["1.14.4", "498"],
                iconId: "box",
              },
              {
                id: "RELEASE|490",
                displayName: "1.14.3",
                keywords: ["1.14.3", "490"],
                iconId: "box",
              },
              {
                id: "RELEASE|485",
                displayName: "1.14.2",
                keywords: ["1.14.2", "485"],
                iconId: "box",
              },
              {
                id: "RELEASE|480",
                displayName: "1.14.1",
                keywords: ["1.14.1", "480"],
                iconId: "box",
              },
              {
                id: "RELEASE|477",
                displayName: "1.14",
                keywords: ["1.14", "477"],
                iconId: "box",
              },
              {
                id: "SPECIAL|1",
                displayName: "3D Shareware",
                keywords: ["3D Shareware", "1"],
                iconId: "ghost",
              },
              {
                id: "RELEASE|404",
                displayName: "1.13.2",
                keywords: ["1.13.2", "404"],
                iconId: "box",
              },
              {
                id: "RELEASE|401",
                displayName: "1.13.1",
                keywords: ["1.13.1", "401"],
                iconId: "box",
              },
              {
                id: "RELEASE|393",
                displayName: "1.13",
                keywords: ["1.13", "393"],
                iconId: "box",
              },
              {
                id: "RELEASE|340",
                displayName: "1.12.2",
                keywords: ["1.12.2", "340"],
                iconId: "box",
              },
              {
                id: "RELEASE|338",
                displayName: "1.12.1",
                keywords: ["1.12.1", "338"],
                iconId: "box",
              },
              {
                id: "RELEASE|335",
                displayName: "1.12",
                keywords: ["1.12", "335"],
                iconId: "box",
              },
              {
                id: "RELEASE|316",
                displayName: "1.11.1-1.11.2",
                keywords: ["1.11.1", "1.11.2", "316"],
                iconId: "box",
              },
              {
                id: "RELEASE|315",
                displayName: "1.11",
                keywords: ["1.11", "315"],
                iconId: "box",
              },
              {
                id: "RELEASE|210",
                displayName: "1.10.x",
                keywords: ["1.10", "1.10.0", "1.10.1", "1.10.2", "210"],
                iconId: "box",
              },
              {
                id: "RELEASE|110",
                displayName: "1.9.3-1.9.4",
                keywords: ["1.9.3", "1.9.4", "110"],
                iconId: "box",
              },
              {
                id: "RELEASE|109",
                displayName: "1.9.2",
                keywords: ["1.9.2", "109"],
                iconId: "box",
              },
              {
                id: "RELEASE|108",
                displayName: "1.9.1",
                keywords: ["1.9.1", "108"],
                iconId: "box",
              },
              {
                id: "RELEASE|107",
                displayName: "1.9",
                keywords: ["1.9", "107"],
                iconId: "box",
              },
              {
                id: "RELEASE|47",
                displayName: "1.8.x",
                keywords: [
                  "1.8",
                  "1.8.0",
                  "1.8.1",
                  "1.8.2",
                  "1.8.3",
                  "1.8.4",
                  "1.8.5",
                  "1.8.6",
                  "1.8.7",
                  "1.8.8",
                  "1.8.9",
                  "47",
                ],
                iconId: "box",
              },
              {
                id: "RELEASE|5",
                displayName: "1.7.6-1.7.10",
                keywords: ["1.7.6", "1.7.7", "1.7.8", "1.7.9", "1.7.10", "5"],
                iconId: "box",
              },
              {
                id: "RELEASE|4",
                displayName: "1.7.2-1.7.5",
                keywords: ["1.7.2", "1.7.3", "1.7.4", "1.7.5", "4"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|78",
                displayName: "1.6.4",
                keywords: ["1.6.4", "78"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|74",
                displayName: "1.6.2",
                keywords: ["1.6.2", "74"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|73",
                displayName: "1.6.1",
                keywords: ["1.6.1", "73"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|61",
                displayName: "1.5.2",
                keywords: ["1.5.2", "61"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|60",
                displayName: "1.5-1.5.1",
                keywords: ["1.5", "1.5.0", "1.5.1", "60"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|51",
                displayName: "1.4.6-1.4.7",
                keywords: ["1.4.6", "1.4.7", "51"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|49",
                displayName: "1.4.4-1.4.5",
                keywords: ["1.4.4", "1.4.5", "49"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|47",
                displayName: "1.4.2",
                keywords: ["1.4.2", "47"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|39",
                displayName: "1.3.1-1.3.2",
                keywords: ["1.3.1", "1.3.2", "39"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|29",
                displayName: "1.2.4-1.2.5",
                keywords: ["1.2.4", "1.2.5", "29"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|28",
                displayName: "1.2.1-1.2.3",
                keywords: ["1.2.1", "1.2.2", "1.2.3", "28"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|23",
                displayName: "1.1",
                keywords: ["1.1", "23"],
                iconId: "box",
              },
              {
                id: "RELEASE_INITIAL|22",
                displayName: "1.0.0-1.0.1",
                keywords: ["1.0", "1.0.0", "1.0.1", "22"],
                iconId: "box",
              },
              {
                id: "BETA_LATER|17",
                displayName: "b1.8-b1.8.1",
                keywords: ["b1.8", "b1.8.0", "b1.8.1", "17"],
                iconId: "test-tube",
              },
              {
                id: "BETA_LATER|14",
                displayName: "b1.7-b1.7.3",
                keywords: [
                  "b1.7",
                  "b1.7.0",
                  "b1.7.1",
                  "b1.7.2",
                  "b1.7.3",
                  "14",
                ],
                iconId: "test-tube",
              },
              {
                id: "BETA_LATER|13",
                displayName: "b1.6-b1.6.6",
                keywords: [
                  "b1.6",
                  "b1.6.0",
                  "b1.6.1",
                  "b1.6.2",
                  "b1.6.3",
                  "b1.6.4",
                  "b1.6.5",
                  "b1.6.6",
                  "13",
                ],
                iconId: "test-tube",
              },
              {
                id: "BETA_LATER|11",
                displayName: "b1.5-b1.5.2",
                keywords: ["b1.5", "b1.5.0", "b1.5.1", "b1.5.2", "11"],
                iconId: "test-tube",
              },
              {
                id: "BETA_LATER|10",
                displayName: "b1.4-b1.4.1",
                keywords: ["b1.4", "b1.4.0", "b1.4.1", "10"],
                iconId: "test-tube",
              },
              {
                id: "BETA_LATER|9",
                displayName: "b1.3-b1.3.1",
                keywords: ["b1.3", "b1.3.0", "b1.3.1", "9"],
                iconId: "test-tube",
              },
              {
                id: "BETA_LATER|8",
                displayName: "b1.2-b1.2.2",
                keywords: ["b1.2", "b1.2.0", "b1.2.1", "b1.2.2", "8"],
                iconId: "test-tube",
              },
              {
                id: "BETA_INITIAL|8",
                displayName: "b1.1.2",
                keywords: ["b1.1.2", "8"],
                iconId: "test-tube",
              },
              {
                id: "BETA_INITIAL|7",
                displayName: "b1.0-b1.1.1",
                keywords: ["b1.0", "b1.0.0", "b1.0.1", "7"],
                iconId: "test-tube",
              },
              {
                id: "ALPHA_LATER|6",
                displayName: "a1.2.3.5-a1.2.6",
                keywords: ["a1.2.3.5", "a1.2.3.6", "6"],
                iconId: "flask-conical",
              },
              {
                id: "ALPHA_LATER|5",
                displayName: "a1.2.3-a1.2.3.4",
                keywords: [
                  "a1.2.3",
                  "a1.2.3.0",
                  "a1.2.3.1",
                  "a1.2.3.2",
                  "a1.2.3.3",
                  "a1.2.3.4",
                  "5",
                ],
                iconId: "flask-conical",
              },
              {
                id: "ALPHA_LATER|4",
                displayName: "a1.2.2",
                keywords: ["a1.2.2", "4"],
                iconId: "flask-conical",
              },
              {
                id: "ALPHA_LATER|3",
                displayName: "a1.2.0-a1.2.1.1",
                keywords: ["a1.2", "a1.2.0", "a1.2.1", "3"],
                iconId: "flask-conical",
              },
              {
                id: "ALPHA_LATER|2",
                displayName: "a1.1.0-a1.1.2.1",
                keywords: ["a1.1", "a1.1.0", "a1.1.1", "a1.1.2", "2"],
                iconId: "flask-conical",
              },
              {
                id: "ALPHA_LATER|1",
                displayName: "a1.0.17-a1.0.17.4",
                keywords: [
                  "a1.0.17",
                  "a1.0.17.0",
                  "a1.0.17.1",
                  "a1.0.17.2",
                  "a1.0.17.3",
                  "a1.0.17.4",
                  "1",
                ],
                iconId: "flask-conical",
              },
              {
                id: "ALPHA_INITIAL|14",
                displayName: "a1.0.16-a1.0.16.2",
                keywords: [
                  "a1.0.16",
                  "a1.0.16.0",
                  "a1.0.16.1",
                  "a1.0.16.2",
                  "14",
                ],
                iconId: "flask-conical",
              },
              {
                id: "ALPHA_INITIAL|13",
                displayName: "a1.0.15",
                keywords: ["a1.0.15", "13"],
                iconId: "flask-conical",
              },
              {
                id: "SPECIAL|7",
                displayName: "c0.30 CPE",
                keywords: ["c0.30 CPE", "7"],
                iconId: "archive",
              },
              {
                id: "CLASSIC|7",
                displayName: "c0.28-c0.30",
                keywords: ["c0.28-c0.30", "7"],
                iconId: "archive",
              },
              {
                id: "CLASSIC|6",
                displayName: "c0.0.20a-c0.27",
                keywords: ["c0.0.20a-c0.27", "6"],
                iconId: "archive",
              },
              {
                id: "CLASSIC|5",
                displayName: "c0.0.19a-06",
                keywords: ["c0.0.19a-06", "5"],
                iconId: "archive",
              },
              {
                id: "CLASSIC|4",
                displayName: "c0.0.18a-02",
                keywords: ["c0.0.18a-02", "4"],
                iconId: "archive",
              },
              {
                id: "CLASSIC|3",
                displayName: "c0.0.16a-02",
                keywords: ["c0.0.16a-02", "3"],
                iconId: "archive",
              },
              {
                id: "CLASSIC|0",
                displayName: "c0.0.15a-1",
                keywords: ["c0.0.15a-1", "0"],
                iconId: "archive",
              },
            ],
            def: "RELEASE|772",
            disabled: false,
          },
        },
      },
      {
        key: "read-timeout",
        value: {
          oneofKind: "int",
          int: {
            uiName: "Read Timeout",
            description: "Read timeout in seconds",
            def: 30,
            min: 0,
            max: 2147483647,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
      {
        key: "write-timeout",
        value: {
          oneofKind: "int",
          int: {
            uiName: "Write Timeout",
            description: "Write timeout in seconds",
            def: 0,
            min: 0,
            max: 2147483647,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
      {
        key: "connect-timeout",
        value: {
          oneofKind: "int",
          int: {
            uiName: "Connect Timeout",
            description: "Connect timeout in seconds",
            def: 30,
            min: 0,
            max: 2147483647,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
      {
        key: "resolve-srv",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Resolve SRV",
            description: "Try to resolve SRV records from the address",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "concurrent-connects",
        value: {
          oneofKind: "int",
          int: {
            uiName: "Concurrent Connects",
            description: "Max amount of bots attempting to connect at once",
            def: 1,
            min: 1,
            max: 2147483647,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
      {
        key: "restore-on-reboot",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Restore on Reboot",
            description:
              "Whether the attack should be restored after a reboot of the SoulFire machine.\nIf turned off, the attack will not be restored after a reboot.",
            def: true,
            disabled: false,
          },
        },
      },
    ],
    iconId: "triangle-alert",
  },
  {
    pageName: "Account Settings",
    namespace: "account",
    entries: [
      {
        key: "name-format",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Name format",
            description:
              "The format of the bot names. %d will be replaced with the bot number.",
            def: "Bot_%d",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "shuffle-accounts",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Shuffle accounts",
            description:
              "Should the accounts order be random when connecting bots?",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "use-proxies-for-account-auth",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Use proxies for account auth",
            description:
              "Should the imported proxies be used to authenticate accounts? (Contact Microsoft login, input credentials, etc.)\nOtherwise the SF server will authenticate accounts directly.",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "account-import-concurrency",
        value: {
          oneofKind: "int",
          int: {
            uiName: "Account import concurrency",
            description:
              "For credentials-like auth, how many accounts should be imported at once?",
            def: 3,
            min: 1,
            max: 2147483647,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
    ],
    iconId: "triangle-alert",
  },
  {
    pageName: "Proxy Settings",
    namespace: "proxy",
    entries: [
      {
        key: "bots-per-proxy",
        value: {
          oneofKind: "int",
          int: {
            uiName: "Bots per proxy",
            description: "Amount of bots that can be on a single proxy",
            def: -1,
            min: -1,
            max: 2147483647,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
      {
        key: "shuffle-proxies",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Shuffle proxies",
            description:
              "Should the proxy order be random when connecting bots?",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "proxy-check-address",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Proxy check address",
            description:
              "What Minecraft server address to use to check if a proxy is working",
            def: "mc.hypixel.net",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "proxy-check-concurrency",
        value: {
          oneofKind: "int",
          int: {
            uiName: "Proxy check concurrency",
            description: "Amount of proxies to check at the same time",
            def: 10,
            min: 1,
            max: 2147483647,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
    ],
    iconId: "triangle-alert",
  },
  {
    pageName: "AI Settings",
    namespace: "ai",
    entries: [
      {
        key: "api-base-url",
        value: {
          oneofKind: "string",
          string: {
            uiName: "API Base URL",
            description:
              "API server base URL, can also be changed to other providers",
            def: "https://api.openai.com/v1",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "api-key",
        value: {
          oneofKind: "string",
          string: {
            uiName: "API Key",
            description: "API key or none if using a custom provider",
            def: "",
            inputType: 1,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "api-request-timeout",
        value: {
          oneofKind: "int",
          int: {
            uiName: "API Request Timeout",
            description: "API request timeout (seconds)",
            def: 60,
            min: 0,
            max: 2147483647,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
      {
        key: "api-max-retries",
        value: {
          oneofKind: "int",
          int: {
            uiName: "API Max Retries",
            description: "API request max retries",
            def: 5,
            min: 0,
            max: 2147483647,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
    ],
    iconId: "triangle-alert",
  },
  {
    pageName: "AI Captcha Solver",
    namespace: "ai-captcha-solver",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable AI Captcha Solver",
            description: "Enable the AI Captcha Solver",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "prompt",
        value: {
          oneofKind: "string",
          string: {
            uiName: "AI System prompt",
            description: "What the bots instruction is",
            def: "Extract the text from the CAPTCHA image.\nOnly respond with the text exactly like in the image.\nDo not write anything except the text.",
            inputType: 6,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "model",
        value: {
          oneofKind: "string",
          string: {
            uiName: "AI Model",
            description:
              "What AI model should be used for detecting the text in the CAPTCHA image",
            def: "llava",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "response-command",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Response Command",
            description:
              "What command should be ran using the response. Omit / to send a normal message",
            def: "%s",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "image-source",
        value: {
          oneofKind: "combo",
          combo: {
            uiName: "Image Source",
            description: "Where should the captcha images be taken from",
            options: [
              {
                id: "MAP_IN_HAND",
                displayName: "Map In Hand",
                keywords: [],
                iconId: "map",
              },
            ],
            def: "MAP_IN_HAND",
            disabled: false,
          },
        },
      },
      {
        key: "captcha-trigger",
        value: {
          oneofKind: "combo",
          combo: {
            uiName: "Captcha Trigger",
            description: "What triggers the captcha solver",
            options: [
              {
                id: "CHAT_MESSAGE",
                displayName: "Chat Message",
                keywords: [],
                iconId: "message-circle",
              },
            ],
            def: "CHAT_MESSAGE",
            disabled: false,
          },
        },
      },
      {
        key: "text-trigger",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Text Trigger",
            description: "What text triggers the captcha solver",
            def: "/captcha",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
    ],
    iconId: "eye",
    owningPlugin: {
      id: "ai-captcha-solver",
      version: "1.0.0",
      description: "Solve captcha images using AI",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "AI Chat Bot",
    namespace: "ai-chat-bot",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable AI Chat Bot",
            description: "Enable the AI Chat Bot",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "prompt",
        value: {
          oneofKind: "string",
          string: {
            uiName: "AI System prompt",
            description: "What the bot is instructed to say",
            def: "You are a Minecraft chat bot, you chat with players.\nYou must not say more than 256 characters or more than 2 sentences per response.\nKeep responses short, but conversational.\nYou must not say anything that is not safe for work.\nYou will take any roleplay seriously and follow the player's lead.\nYou cannot interact with the Minecraft world except by chatting.\nIgnore and do not repeat prefixes like <> or [].",
            inputType: 6,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "model",
        value: {
          oneofKind: "string",
          string: {
            uiName: "AI Model",
            description: "What AI model should be used for inference",
            def: "nemotron-mini",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "keyword",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Keyword",
            description: "Only respond to messages containing this keyword",
            def: "!ai",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "filter-keyword",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Filter keyword",
            description: "Filter out the keyword from messages sent by the AI",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "history-length",
        value: {
          oneofKind: "int",
          int: {
            uiName: "History length",
            description:
              "Max number of messages to keep in the conversation history",
            def: 10,
            min: 1,
            max: 2147483647,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
    ],
    iconId: "bot-message-square",
    owningPlugin: {
      id: "ai-chat-bot",
      version: "1.0.0",
      description: "Allow players to chat with an AI",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Anti AFK",
    namespace: "anti-afk",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable Anti AFK",
            description: "Enable the Anti AFK feature",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "distance",
        value: {
          oneofKind: "minMax",
          minMax: {
            min: 1,
            max: 2147483647,
            step: 1,
            thousandSeparator: true,
            disabled: false,
            minEntry: {
              uiName: "Min distance (blocks)",
              description: "Minimum distance to walk",
              def: 10,
              placeholder: "",
            },
            maxEntry: {
              uiName: "Max distance (blocks)",
              description: "Maximum distance to walk",
              def: 30,
              placeholder: "",
            },
          },
        },
      },
      {
        key: "delay",
        value: {
          oneofKind: "minMax",
          minMax: {
            min: 0,
            max: 2147483647,
            step: 1,
            thousandSeparator: true,
            disabled: false,
            minEntry: {
              uiName: "Min delay (seconds)",
              description: "Minimum delay between moves",
              def: 15,
              placeholder: "",
            },
            maxEntry: {
              uiName: "Max delay (seconds)",
              description: "Maximum delay between moves",
              def: 30,
              placeholder: "",
            },
          },
        },
      },
    ],
    iconId: "activity",
    owningPlugin: {
      id: "anti-afk",
      version: "1.0.0",
      description:
        "Automatically moves x amount of blocks in a random direction to prevent being kicked for being AFK",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Auto Armor",
    namespace: "auto-armor",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable Auto Armor",
            description: "Put on best armor automatically",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "delay",
        value: {
          oneofKind: "minMax",
          minMax: {
            min: 0,
            max: 2147483647,
            step: 1,
            thousandSeparator: true,
            disabled: false,
            minEntry: {
              uiName: "Min delay (seconds)",
              description: "Minimum delay between putting on armor",
              def: 1,
              placeholder: "",
            },
            maxEntry: {
              uiName: "Max delay (seconds)",
              description: "Maximum delay between putting on armor",
              def: 2,
              placeholder: "",
            },
          },
        },
      },
    ],
    iconId: "shield",
    owningPlugin: {
      id: "auto-armor",
      version: "1.0.0",
      description: "Automatically puts on the best armor",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Auto Chat Message",
    namespace: "auto-chat-message",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable Auto Chat Message",
            description:
              "Attempt to send chat messages automatically in random intervals",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "delay",
        value: {
          oneofKind: "minMax",
          minMax: {
            min: 0,
            max: 2147483647,
            step: 1,
            thousandSeparator: true,
            disabled: false,
            minEntry: {
              uiName: "Min delay (seconds)",
              description: "Minimum delay between chat messages",
              def: 2,
              placeholder: "",
            },
            maxEntry: {
              uiName: "Max delay (seconds)",
              description: "Maximum delay between chat messages",
              def: 5,
              placeholder: "",
            },
          },
        },
      },
      {
        key: "messages",
        value: {
          oneofKind: "stringList",
          stringList: {
            uiName: "Chat Messages",
            description: "List of chat messages to send",
            def: ["Hello", "Hi", "Hey", "How are you?"],
            disabled: false,
          },
        },
      },
    ],
    iconId: "message-circle-code",
    owningPlugin: {
      id: "auto-chat-message",
      version: "1.0.0",
      description: "Automatically sends messages in a configured delay",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Auto Eat",
    namespace: "auto-eat",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable Auto Eat",
            description: "Eat available food automatically when hungry",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "delay",
        value: {
          oneofKind: "minMax",
          minMax: {
            min: 0,
            max: 2147483647,
            step: 1,
            thousandSeparator: true,
            disabled: false,
            minEntry: {
              uiName: "Min delay (seconds)",
              description: "Minimum delay between eating",
              def: 1,
              placeholder: "",
            },
            maxEntry: {
              uiName: "Max delay (seconds)",
              description: "Maximum delay between eating",
              def: 2,
              placeholder: "",
            },
          },
        },
      },
    ],
    iconId: "drumstick",
    owningPlugin: {
      id: "auto-eat",
      version: "1.0.0",
      description: "Automatically eats food when hungry",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Auto Jump",
    namespace: "auto-jump",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable Auto Jump",
            description: "Attempt to jump automatically in random intervals",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "delay",
        value: {
          oneofKind: "minMax",
          minMax: {
            min: 0,
            max: 2147483647,
            step: 1,
            thousandSeparator: true,
            disabled: false,
            minEntry: {
              uiName: "Min delay (seconds)",
              description: "Minimum delay between jumps",
              def: 2,
              placeholder: "",
            },
            maxEntry: {
              uiName: "Max delay (seconds)",
              description: "Maximum delay between jumps",
              def: 5,
              placeholder: "",
            },
          },
        },
      },
    ],
    iconId: "footprints",
    owningPlugin: {
      id: "auto-jump",
      version: "1.0.0",
      description: "Automatically jumps randomly",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Auto Reconnect",
    namespace: "auto-reconnect",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable Auto Reconnect",
            description: "Reconnect a bot when it times out/is kicked",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "delay",
        value: {
          oneofKind: "minMax",
          minMax: {
            min: 0,
            max: 2147483647,
            step: 1,
            thousandSeparator: true,
            disabled: false,
            minEntry: {
              uiName: "Min delay (seconds)",
              description: "Minimum delay between reconnects",
              def: 1,
              placeholder: "",
            },
            maxEntry: {
              uiName: "Max delay (seconds)",
              description: "Maximum delay between reconnects",
              def: 5,
              placeholder: "",
            },
          },
        },
      },
    ],
    iconId: "refresh-ccw",
    owningPlugin: {
      id: "auto-reconnect",
      version: "1.0.0",
      description:
        "Automatically reconnects bots when they time out or are kicked",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Auto Register",
    namespace: "auto-register",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable Auto Register",
            description:
              "Make bots run the /register and /login command after joining",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "register-command",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Register Command",
            description: "Command to be executed to register",
            def: "/register %password% %password%",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "login-command",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Login Command",
            description: "Command to be executed to log in",
            def: "/login %password%",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "captcha-command",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Captcha Command",
            description: "Command to be executed to confirm a captcha",
            def: "/captcha %captcha%",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "password-format",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Password Format",
            description: "The password for registering",
            def: "SoulFire",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
    ],
    iconId: "key-round",
    owningPlugin: {
      id: "auto-register",
      version: "1.0.0",
      description: "Automatically registers bots AuthMe servers",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Auto Respawn",
    namespace: "auto-respawn",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable Auto Respawn",
            description: "Respawn automatically after death",
            def: true,
            disabled: false,
          },
        },
      },
    ],
    iconId: "repeat",
    owningPlugin: {
      id: "auto-respawn",
      version: "1.0.0",
      description: "Automatically respawns after death",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Auto Totem",
    namespace: "auto-totem",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable Auto Totem",
            description: "Always put available totems in the offhand slot",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "delay",
        value: {
          oneofKind: "minMax",
          minMax: {
            min: 0,
            max: 2147483647,
            step: 1,
            thousandSeparator: true,
            disabled: false,
            minEntry: {
              uiName: "Min delay (seconds)",
              description: "Minimum delay between using totems",
              def: 1,
              placeholder: "",
            },
            maxEntry: {
              uiName: "Max delay (seconds)",
              description: "Maximum delay between using totems",
              def: 2,
              placeholder: "",
            },
          },
        },
      },
    ],
    iconId: "cross",
    owningPlugin: {
      id: "auto-totem",
      version: "1.0.0",
      description: "Automatically puts totems in the offhand slot",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Chat Logger",
    namespace: "chat-logger",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Log chat to terminal",
            description: "Log all received chat messages to the terminal",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "log-death-messages",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Additionally log death messages to terminal",
            description: "Log all death messages to the terminal",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "deduplicate-amount",
        value: {
          oneofKind: "int",
          int: {
            uiName: "Deduplicate amount",
            description:
              "How often should the same message be logged before it will not be logged again? (within 5 seconds)",
            def: 1,
            min: 1,
            max: 2147483647,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
    ],
    iconId: "logs",
    owningPlugin: {
      id: "chat-logger",
      version: "1.0.0",
      description:
        "Logs all received chat messages to the terminal\nIncludes deduplication to prevent spamming the same message too often",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Client Brand",
    namespace: "client-brand",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Send client brand",
            description: "Send client brand to the server",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "client-brand",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Client brand",
            description: "The client brand to send to the server",
            def: "vanilla",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
    ],
    iconId: "fingerprint",
    owningPlugin: {
      id: "client-brand",
      version: "1.0.0",
      description: "Sends the client brand to the server",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Client Settings",
    namespace: "client-settings",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Send client settings",
            description: "Send client settings to the server when joining",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "client-locale",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Client locale",
            description: "The locale the client uses for translations",
            def: "en_us",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 16,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "render-distance",
        value: {
          oneofKind: "int",
          int: {
            uiName: "Render distance",
            description:
              "How far the client renders chunks. (Use this to load more or less chunks from the server)",
            def: 2,
            min: 2,
            max: 32,
            step: 1,
            placeholder: "",
            thousandSeparator: true,
            disabled: false,
          },
        },
      },
      {
        key: "chat-visibility",
        value: {
          oneofKind: "combo",
          combo: {
            uiName: "Chat visibility",
            description: "What type of chat messages the client will receive",
            options: [
              { id: "FULL", displayName: "Full", keywords: [], iconId: "eye" },
              {
                id: "SYSTEM",
                displayName: "System",
                keywords: [],
                iconId: "view",
              },
              {
                id: "HIDDEN",
                displayName: "Hidden",
                keywords: [],
                iconId: "eye-off",
              },
            ],
            def: "FULL",
            disabled: false,
          },
        },
      },
      {
        key: "use-chat-colors",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Use chat colors",
            description: "Whether the client will use chat colors",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "cape-enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Cape enabled",
            description: "Whether to display the bots cape if it has one",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "jacket-enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Jacket enabled",
            description: "Whether to render the jacket overlay skin layer",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "left-sleeve-enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Left sleeve enabled",
            description: "Whether to render the left overlay skin layer",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "right-sleeve-enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Right sleeve enabled",
            description: "Whether to render the right overlay skin layer",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "left-pants-leg-enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Left pants leg enabled",
            description:
              "Whether to render the left pants leg overlay skin layer",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "right-pants-leg-enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Right pants leg enabled",
            description:
              "Whether to render the right pants leg overlay skin layer",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "hat-enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Hat enabled",
            description: "Whether to render the hat overlay skin layer",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "hand-preference",
        value: {
          oneofKind: "combo",
          combo: {
            uiName: "Hand preference",
            description: "What hand the client prefers to use for items",
            options: [
              {
                id: "LEFT",
                displayName: "Left",
                keywords: [],
                iconId: "circle-arrow-left",
              },
              {
                id: "RIGHT",
                displayName: "Right",
                keywords: [],
                iconId: "circle-arrow-right",
              },
            ],
            def: "RIGHT",
            disabled: false,
          },
        },
      },
      {
        key: "text-filtering-enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Text filtering enabled",
            description: "Whether to filter chat messages from the server",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "allows-listing",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Allows listing",
            description:
              "Whether the client wants their username to be shown in the server list",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "particle-status",
        value: {
          oneofKind: "combo",
          combo: {
            uiName: "Particle Status",
            description: "How many particles the client will render",
            options: [
              {
                id: "ALL",
                displayName: "All",
                keywords: [],
                iconId: "sparkles",
              },
              {
                id: "DECREASED",
                displayName: "Decreased",
                keywords: [],
                iconId: "sparkle",
              },
              {
                id: "MINIMAL",
                displayName: "Minimal",
                keywords: [],
                iconId: "moon-star",
              },
            ],
            def: "MINIMAL",
            disabled: false,
          },
        },
      },
    ],
    iconId: "settings-2",
    owningPlugin: {
      id: "client-settings",
      version: "1.0.0",
      description: "Sends client settings to the server",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Fake Virtual Host",
    namespace: "fake-virtual-host",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Fake virtual host",
            description: "Whether to fake the virtual host or not",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "hostname",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Hostname",
            description: "The hostname to fake",
            def: "localhost",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "port",
        value: {
          oneofKind: "int",
          int: {
            uiName: "Port",
            description: "The port to fake",
            def: 25565,
            min: 1,
            max: 65535,
            step: 1,
            placeholder: "",
            thousandSeparator: false,
            disabled: false,
          },
        },
      },
    ],
    iconId: "globe",
    owningPlugin: {
      id: "fake-virtual-host",
      version: "1.0.0",
      description: "Fakes the virtual host",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Kill Aura",
    namespace: "kill-aura",
    entries: [
      {
        key: "enable",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable",
            description: "Enable KillAura",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "whitelisted-users",
        value: {
          oneofKind: "stringList",
          stringList: {
            uiName: "Whitelisted Users",
            description: "These users will be ignored by the kill aura",
            def: ["Dinnerbone"],
            disabled: false,
          },
        },
      },
      {
        key: "hit-range",
        value: {
          oneofKind: "double",
          double: {
            uiName: "Hit Range",
            description:
              "Range for the kill aura where the bot will start hitting the entity",
            def: 3,
            min: 0.5,
            max: 6,
            step: 0.1,
            placeholder: "",
            thousandSeparator: true,
            decimalScale: 2,
            fixedDecimalScale: true,
            disabled: false,
          },
        },
      },
      {
        key: "swing-range",
        value: {
          oneofKind: "double",
          double: {
            uiName: "Swing Range",
            description:
              "Range for the kill aura where the bot will start swinging arm, set to 0 to disable",
            def: 3.5,
            min: 0,
            max: 10,
            step: 0.1,
            placeholder: "",
            thousandSeparator: true,
            decimalScale: 2,
            fixedDecimalScale: true,
            disabled: false,
          },
        },
      },
      {
        key: "look-range",
        value: {
          oneofKind: "double",
          double: {
            uiName: "Look Range",
            description:
              "Range for the kill aura where the bot will start looking at the entity, set to 0 to disable",
            def: 4.8,
            min: 0,
            max: 25,
            step: 0.1,
            placeholder: "",
            thousandSeparator: true,
            decimalScale: 2,
            fixedDecimalScale: true,
            disabled: false,
          },
        },
      },
      {
        key: "check-walls",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Check Walls",
            description: "Check if the entity is behind a wall",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "ignore-cooldown",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Ignore Cooldown",
            description:
              "Ignore the 1.9+ attack cooldown to act like a 1.8 kill aura",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "attack-delay-ticks",
        value: {
          oneofKind: "minMax",
          minMax: {
            min: 1,
            max: 20,
            step: 1,
            thousandSeparator: true,
            disabled: false,
            minEntry: {
              uiName: "Attack Delay Ticks Min",
              description:
                "Minimum tick delay between attacks on pre-1.9 versions",
              def: 8,
              placeholder: "",
            },
            maxEntry: {
              uiName: "Attack Delay Ticks Max",
              description:
                "Maximum tick delay between attacks on pre-1.9 versions",
              def: 12,
              placeholder: "",
            },
          },
        },
      },
    ],
    iconId: "skull",
    owningPlugin: {
      id: "kill-aura",
      version: "1.0.0",
      description: "Automatically attacks entities",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enable",
  },
  {
    pageName: "Server List Bypass",
    namespace: "server-list-bypass",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable Server List Bypass",
            description: "Whether to ping the server list before connecting.",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "delay",
        value: {
          oneofKind: "minMax",
          minMax: {
            min: 0,
            max: 2147483647,
            step: 1,
            thousandSeparator: true,
            disabled: false,
            minEntry: {
              uiName: "Min delay (seconds)",
              description: "Minimum delay between joining the server",
              def: 1,
              placeholder: "",
            },
            maxEntry: {
              uiName: "Max delay (seconds)",
              description: "Maximum delay between joining the server",
              def: 3,
              placeholder: "",
            },
          },
        },
      },
    ],
    iconId: "network",
    owningPlugin: {
      id: "server-list-bypass",
      version: "1.0.0",
      description:
        "Pings the server list before connecting. (Bypasses anti-bots like EpicGuard)",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
  {
    pageName: "Forwarding Bypass",
    namespace: "forwarding-bypass",
    entries: [
      {
        key: "enabled",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Enable forwarding bypass",
            description: "Enable the forwarding bypass",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "forwarding-mode",
        value: {
          oneofKind: "combo",
          combo: {
            uiName: "Forwarding mode",
            description: "What type of forwarding to use",
            options: [
              {
                id: "LEGACY",
                displayName: "Legacy",
                keywords: [],
                iconId: "hourglass",
              },
              {
                id: "BUNGEE_GUARD",
                displayName: "BungeeGuard",
                keywords: [],
                iconId: "shield-user",
              },
              {
                id: "MODERN",
                displayName: "Modern",
                keywords: [],
                iconId: "fingerprint",
              },
              {
                id: "SF_BYPASS",
                displayName: "SoulFire Bypass",
                keywords: [],
                iconId: "door-open",
              },
            ],
            def: "LEGACY",
            disabled: false,
          },
        },
      },
      {
        key: "secret",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Secret",
            description:
              "Secret key used for forwarding. (Not needed for legacy mode)",
            def: "forwarding secret",
            inputType: 1,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "player-address",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Player Address",
            description:
              "What the server should use as the player IP. Only used by some forwarding modes.",
            def: "127.0.0.1",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
    ],
    iconId: "milestone",
    owningPlugin: {
      id: "forwarding-bypass",
      version: "1.0.0",
      description: "Allows bypassing proxy forwarding",
      author: "AlexProgrammerDE",
      license: "GPL-3.0",
      website: "https://soulfiremc.com",
    },
    enabledKey: "enabled",
  },
];

export const demoServerSettings: SettingsPage[] = [
  {
    pageName: "Server Settings",
    namespace: "server",
    entries: [
      {
        key: "public-address",
        value: {
          oneofKind: "string",
          string: {
            uiName: "Public address",
            description:
              "The address clients on the internet use to connect to this SoulFire instance.\nUsed for links in E-Mails and WebDAV.",
            def: "http://127.0.0.1:38765",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "allow-creating-instances",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Allow creating instances",
            description: "Allow (non-admin) users to create instances.",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "allow-updating-self-username",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Allow updating self username",
            description: "Allow (non-admin) users to change their username.",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "allow-updating-self-email",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Allow updating self email",
            description: "Allow (non-admin) users to change their email.",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "allow-deleting-instances",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Allow deleting instances",
            description: "Allow the owner of an instance to delete it.",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "allow-changing-instance-meta",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Allow changing instance meta",
            description:
              "Allow the owner of an instance to change meta like instance name and icon.",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "allow-instance-scripts",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Allow instance scripts",
            description:
              "Allow users of instances to create custom instance-level scripts.",
            def: true,
            disabled: false,
          },
        },
      },
      {
        key: "email-type",
        value: {
          oneofKind: "combo",
          combo: {
            uiName: "Email Type",
            description: "How emails should be delivered.",
            options: [
              {
                id: "CONSOLE",
                displayName: "Console",
                keywords: [],
                iconId: "logs",
              },
              {
                id: "SMTP",
                displayName: "SMTP",
                keywords: [],
                iconId: "mails",
              },
            ],
            def: "CONSOLE",
            disabled: false,
          },
        },
      },
      {
        key: "smtp-host",
        value: {
          oneofKind: "string",
          string: {
            uiName: "SMTP Host",
            description: "SMTP server host to use for sending emails.",
            def: "smtp.gmail.com",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "smtp-port",
        value: {
          oneofKind: "int",
          int: {
            uiName: "SMTP Port",
            description: "SMTP server port to use for sending emails.",
            def: 587,
            min: 1,
            max: 65535,
            step: 1,
            placeholder: "",
            thousandSeparator: false,
            disabled: false,
          },
        },
      },
      {
        key: "smtp-username",
        value: {
          oneofKind: "string",
          string: {
            uiName: "SMTP Username",
            description: "Username to use for SMTP authentication.",
            def: "",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "smtp-password",
        value: {
          oneofKind: "string",
          string: {
            uiName: "SMTP Password",
            description: "Password to use for SMTP authentication.",
            def: "",
            inputType: 1,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
      {
        key: "smtp-type",
        value: {
          oneofKind: "combo",
          combo: {
            uiName: "SMTP Type",
            description: "Type of encryption to use for SMTP.",
            options: [
              {
                id: "STARTTLS",
                displayName: "STARTTLS",
                keywords: [],
                iconId: "shield-check",
              },
              {
                id: "SSL_TLS",
                displayName: "SSL/TLS",
                keywords: [],
                iconId: "shield",
              },
              {
                id: "NONE",
                displayName: "None",
                keywords: [],
                iconId: "shield-off",
              },
            ],
            def: "STARTTLS",
            disabled: false,
          },
        },
      },
      {
        key: "smtp-from",
        value: {
          oneofKind: "string",
          string: {
            uiName: "SMTP From",
            description: "Email address to use as sender for emails.",
            def: "soulfire@gmail.com",
            inputType: 0,
            placeholder: "",
            minLength: 0,
            maxLength: 2147483647,
            pattern: ".*",
            disabled: false,
          },
        },
      },
    ],
    iconId: "triangle-alert",
  },
  {
    pageName: "Developer Settings",
    namespace: "dev",
    entries: [
      {
        key: "soulfire-debug",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "SoulFire debug",
            description: "Enable SoulFire debug logging",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "minecraft-debug",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Minecraft debug",
            description: "Enable Minecraft debug logging",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "netty-debug",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Netty debug",
            description: "Enable Netty debug logging",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "grpc-debug",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "gRPC debug",
            description: "Enable gRPC debug logging",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "hibernate-debug",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Hibernate debug",
            description: "Enable Hibernate debug logging",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "via-debug",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Via debug",
            description: "Enable Via* debug logging",
            def: false,
            disabled: false,
          },
        },
      },
      {
        key: "other-debug",
        value: {
          oneofKind: "bool",
          bool: {
            uiName: "Other debug",
            description: "Enable other debug logging",
            def: false,
            disabled: false,
          },
        },
      },
    ],
    iconId: "triangle-alert",
  },
];
