import { createRequire } from "node:module";

const require = createRequire(__filename);
const { Bonjour } = require("bonjour-service") as {
  Bonjour: new () => {
    destroy: () => void;
    find: (
      options: { type: string; protocol?: string },
      onUp?: (service: BonjourService) => void,
    ) => BonjourBrowser;
  };
};
const Castv2Client = require("castv2-client") as {
  Application: new (
    client: unknown,
    session: CastSession,
  ) => {
    close: () => void;
    createController: (
      controller: unknown,
      namespace: string,
    ) => {
      close: () => void;
      on: (event: "message", handler: (payload: unknown) => void) => void;
      send: (payload: unknown) => void;
    };
    on: (event: string, handler: () => void) => void;
    session: CastSession;
  };
  Client: new () => CastPlatformClient;
  JsonController: new (
    client: unknown,
    sourceId: string,
    destinationId: string,
    namespace: string,
  ) => {
    close: () => void;
    on: (event: "message", handler: (payload: unknown) => void) => void;
    send: (payload: unknown) => void;
  };
};

const CAST_APP_ID = "3F768D1D";
const CAST_APP_NAMESPACE = "urn:x-cast:com.soulfiremc";
const CAST_SCREEN_MODEL_NAME = "Chromecast";

type BonjourService = {
  addresses?: string[];
  fqdn?: string;
  host?: string;
  name: string;
  port: number;
  referer?: {
    address?: string;
  };
  txt?: Record<string, string>;
};

type BonjourBrowser = {
  on: (event: "down", handler: (service: BonjourService) => void) => void;
  services: () => BonjourService[];
  start: () => void;
  stop: () => void;
};

type CastSession = {
  appId: string;
  sessionId: string;
  transportId: string;
};

type CastPlatformClient = {
  close: () => void;
  connect: (
    options: { host: string; port: number },
    callback: () => void,
  ) => void;
  launch: (
    app: typeof SoulFireCastApplication,
    callback: (error: Error | null, app?: SoulFireCastApplication) => void,
  ) => void;
  on: (event: "error", handler: (error: Error) => void) => void;
};

class SoulFireCastApplication extends Castv2Client.Application {
  static APP_ID = CAST_APP_ID;

  private readonly channel = this.createController(
    Castv2Client.JsonController,
    CAST_APP_NAMESPACE,
  );

  onMessage(handler: (payload: unknown) => void): void {
    this.channel.on("message", handler);
  }

  sendMessage(payload: unknown): void {
    this.channel.send(payload);
  }

  close = (): void => {
    this.channel.close();
    super.close();
  };
}

type DiscoveredCast = {
  address: string;
  full_name: string;
  id: string;
  name: string;
  port: number;
};

type ActiveCastConnection = {
  app: SoulFireCastApplication;
  client: CastPlatformClient;
  transportId: string;
};

export class CastManager {
  private readonly devices = new Map<string, DiscoveredCast>();

  private readonly connections = new Map<string, ActiveCastConnection>();

  private browser: BonjourBrowser | null = null;

  private bonjour: InstanceType<NonNullable<typeof Bonjour>> | null = null;

  constructor(
    private readonly broadcast: (event: string, payload?: unknown) => void,
  ) {}

  discover(): void {
    if (this.browser !== null) {
      return;
    }

    this.bonjour = new Bonjour();
    this.browser = this.bonjour.find(
      {
        protocol: "tcp",
        type: "googlecast",
      },
      (service) => {
        const device = this.toDevice(service);
        if (device === null || this.devices.has(device.full_name)) {
          return;
        }

        this.devices.set(device.full_name, device);
        this.broadcast("cast-device-discovered", device);
      },
    );

    this.browser.on("down", (service) => {
      const fullName = service.fqdn ?? service.name;
      if (!fullName) {
        return;
      }

      if (this.devices.delete(fullName)) {
        this.broadcast("cast-device-removed", {
          full_name: fullName,
        });
      }
    });
  }

  getCasts(): DiscoveredCast[] {
    return Array.from(this.devices.values());
  }

  async connect(address: string, port: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const client = new Castv2Client.Client();
      let settled = false;
      let timeout: NodeJS.Timeout | null = setTimeout(() => {
        timeout = null;
        client.close();
        reject(new Error("Timed out while connecting to Cast device"));
      }, 15_000);

      const rejectOnce = (error: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        if (timeout) {
          clearTimeout(timeout);
        }
        reject(error);
      };

      client.on("error", (error) => {
        rejectOnce(error);
      });

      client.connect(
        {
          host: address,
          port,
        },
        () => {
          client.launch(SoulFireCastApplication, (error, app) => {
            if (error || !app) {
              rejectOnce(error ?? new Error("Failed to launch Cast app"));
              return;
            }

            app.onMessage((payload) => {
              const message = payload as {
                challenge?: string;
                type?: string;
              };
              if (message.type === "CHALLENGE_REQUEST" && message.challenge) {
                app.sendMessage({
                  challenge: message.challenge,
                  type: "CHALLENGE_RESPONSE",
                });
              }

              if (message.type === "LOGIN_SUCCESS" && !settled) {
                settled = true;
                if (timeout) {
                  clearTimeout(timeout);
                }
                const transportId = app.session.transportId;
                this.connections.set(transportId, {
                  app,
                  client,
                  transportId,
                });
                app.on("close", () => {
                  this.connections.delete(transportId);
                  this.broadcast("cast-device-disconnected", {
                    transport_id: transportId,
                  });
                  client.close();
                });
                resolve(transportId);
              }
            });

            app.sendMessage({
              type: "INITIAL_HELLO",
            });
          });
        },
      );
    });
  }

  broadcastMessage(payload: unknown): void {
    for (const [transportId, connection] of this.connections.entries()) {
      try {
        connection.app.sendMessage(payload);
      } catch (error) {
        console.error("Failed to send Cast payload", error);
        this.connections.delete(transportId);
        connection.client.close();
      }
    }
  }

  dispose(): void {
    this.browser?.stop();
    this.browser = null;
    this.bonjour?.destroy();
    this.bonjour = null;

    for (const connection of this.connections.values()) {
      connection.client.close();
    }
    this.connections.clear();
    this.devices.clear();
  }

  private toDevice(service: BonjourService): DiscoveredCast | null {
    const txt = service.txt ?? {};
    if (txt.md && txt.md !== CAST_SCREEN_MODEL_NAME) {
      return null;
    }

    const id = txt.id;
    const name = txt.fn;
    const address =
      service.addresses?.find((candidate) => candidate.includes(".")) ??
      service.referer?.address ??
      service.host;

    if (!id || !name || !address) {
      return null;
    }

    return {
      address: address.replace(/\.$/, ""),
      full_name: service.fqdn ?? service.name,
      id,
      name,
      port: service.port,
    };
  }
}
