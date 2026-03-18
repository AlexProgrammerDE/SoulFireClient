import { Link } from "@tanstack/react-router";
import {
  ActivityIcon,
  BotIcon,
  CircleAlertIcon,
  Code2Icon,
  LoaderCircleIcon,
  LogInIcon,
  LogOutIcon,
  MessageSquareIcon,
  PauseIcon,
  PlayIcon,
  SearchIcon,
  SquareIcon,
  SquareTerminalIcon,
} from "lucide-react";
import {
  use,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { TransportContext } from "@/components/providers/transport-context.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { EventsServiceClient } from "@/generated/soulfire/events.client.ts";
import type { EventEntry, EventScope } from "@/generated/soulfire/events.ts";
import {
  EventCategory,
  EventSeverity,
  EventType,
} from "@/generated/soulfire/events.ts";
import { cn, isDemo, timestampToDate } from "@/lib/utils.tsx";

type FeedFilter =
  | "all"
  | "errors"
  | "bots"
  | "chat"
  | "commands"
  | "scripts"
  | "messages";
type StreamState = "connecting" | "live" | "reconnecting";
type TimelineItem =
  | {
      kind: "marker";
      key: string;
      label: string;
    }
  | {
      kind: "event";
      event: EventEntry;
    };

const COMPACT_LIMIT = 40;
const FULL_LIMIT = 250;

function makeDemoEvents(): EventEntry[] {
  const now = new Date();
  const at = (offsetSeconds: number) => {
    const date = new Date(now.getTime() - offsetSeconds * 1000);
    return {
      seconds: BigInt(Math.floor(date.getTime() / 1000)),
      nanos: date.getMilliseconds() * 1_000_000,
    };
  };

  return [
    {
      id: "demo-1",
      timestamp: at(55),
      severity: EventSeverity.SUCCESS,
      category: EventCategory.SESSION,
      type: EventType.SESSION_STARTED,
      summary: "Session started",
      body: "24 bots queued with 6 active proxies",
      personal: false,
      instanceName: "Demo",
      repeatCount: 1,
    },
    {
      id: "demo-2",
      timestamp: at(42),
      severity: EventSeverity.SUCCESS,
      category: EventCategory.BOT,
      type: EventType.BOT_JOINED,
      summary: "Pistonmaster joined the world",
      body: "mc.example.net",
      personal: false,
      instanceName: "Demo",
      botAccountName: "Pistonmaster",
      repeatCount: 1,
    },
    {
      id: "demo-3",
      timestamp: at(30),
      severity: EventSeverity.INFO,
      category: EventCategory.CHAT,
      type: EventType.CHAT_MESSAGE,
      summary: "Pistonmaster",
      body: "[Server] Welcome to the network.",
      personal: false,
      instanceName: "Demo",
      botAccountName: "Pistonmaster",
      repeatCount: 1,
    },
    {
      id: "demo-4",
      timestamp: at(18),
      severity: EventSeverity.INFO,
      category: EventCategory.COMMAND,
      type: EventType.COMMAND_EXECUTED,
      summary: "Command executed",
      body: "move 100 64 100",
      command: "move 100 64 100",
      personal: false,
      instanceName: "Demo",
      userName: "alex",
      repeatCount: 1,
    },
    {
      id: "demo-5",
      timestamp: at(8),
      severity: EventSeverity.ERROR,
      category: EventCategory.SYSTEM,
      type: EventType.SYSTEM_ERROR,
      summary: "Failed to connect to target server",
      body: "java.net.ConnectException: Connection refused",
      personal: false,
      instanceName: "Demo",
      loggerName: "BotConnection",
      repeatCount: 1,
    },
  ];
}

function mergeConsecutiveEvents(events: EventEntry[]): EventEntry[] {
  return events.reduce<EventEntry[]>((result, event) => {
    const previous = result[result.length - 1];
    if (previous && previous.id === event.id) {
      previous.repeatCount = Math.max(
        previous.repeatCount || 1,
        event.repeatCount || 1,
      );
      previous.timestamp = event.timestamp;
      if (event.body) {
        previous.body = event.body;
      }
      return result;
    }

    if (
      previous &&
      previous.type === event.type &&
      previous.summary === event.summary &&
      previous.body === event.body &&
      previous.botAccountId === event.botAccountId &&
      previous.scriptId === event.scriptId &&
      previous.userId === event.userId
    ) {
      previous.repeatCount += event.repeatCount || 1;
      previous.timestamp = event.timestamp;
      return result;
    }

    result.push({
      ...event,
      repeatCount: event.repeatCount || 1,
    });
    return result;
  }, []);
}

function limitEvents(events: EventEntry[], compact: boolean) {
  const max = compact ? COMPACT_LIMIT : FULL_LIMIT;
  if (events.length <= max) {
    return events;
  }

  return events.slice(events.length - max);
}

function formatTime(event: EventEntry, locale: string) {
  if (!event.timestamp) {
    return "--:--:--";
  }

  return timestampToDate(event.timestamp).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function matchesFilter(event: EventEntry, filter: FeedFilter) {
  switch (filter) {
    case "all":
      return true;
    case "errors":
      return (
        event.severity === EventSeverity.WARN ||
        event.severity === EventSeverity.ERROR
      );
    case "bots":
      return event.category === EventCategory.BOT;
    case "chat":
      return event.category === EventCategory.CHAT;
    case "commands":
      return event.category === EventCategory.COMMAND;
    case "scripts":
      return event.category === EventCategory.SCRIPT;
    case "messages":
      return (
        event.category === EventCategory.MESSAGE ||
        event.category === EventCategory.SYSTEM
      );
  }
}

function countByFilter(events: EventEntry[], filter: FeedFilter) {
  return events.filter((event) => matchesFilter(event, filter)).length;
}

function buildTimelineItems(
  events: EventEntry[],
  locale: string,
): TimelineItem[] {
  const items: TimelineItem[] = [];
  let previousBucketKey: string | null = null;

  for (const event of events) {
    if (!event.timestamp) {
      items.push({
        kind: "event",
        event,
      });
      continue;
    }

    const date = timestampToDate(event.timestamp);
    const bucketKey = [
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
    ].join("-");
    if (bucketKey !== previousBucketKey) {
      previousBucketKey = bucketKey;
      items.push({
        kind: "marker",
        key: bucketKey,
        label: date.toLocaleString(locale, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      });
    }

    items.push({
      kind: "event",
      event,
    });
  }

  return items;
}

function matchesQuery(event: EventEntry, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    event.summary,
    event.body,
    event.instanceName,
    event.botAccountName,
    event.scriptName,
    event.userName,
    event.command,
    event.loggerName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function severityBadgeVariant(event: EventEntry) {
  switch (event.severity) {
    case EventSeverity.ERROR:
      return "destructive" as const;
    case EventSeverity.WARN:
      return "outline" as const;
    case EventSeverity.SUCCESS:
      return "default" as const;
    default:
      return "secondary" as const;
  }
}

function severityLabel(event: EventEntry) {
  switch (event.severity) {
    case EventSeverity.ERROR:
      return "Error";
    case EventSeverity.WARN:
      return "Warn";
    case EventSeverity.SUCCESS:
      return "Success";
    default:
      return "Info";
  }
}

function severityTone(event: EventEntry) {
  switch (event.severity) {
    case EventSeverity.ERROR:
      return "border-l-destructive bg-destructive/5";
    case EventSeverity.WARN:
      return "border-l-yellow-500 bg-yellow-500/6";
    case EventSeverity.SUCCESS:
      return "border-l-emerald-500 bg-emerald-500/6";
    default:
      return "border-l-sky-500 bg-sky-500/6";
  }
}

function categoryLabel(event: EventEntry) {
  switch (event.category) {
    case EventCategory.SESSION:
      return "Session";
    case EventCategory.BOT:
      return "Bot";
    case EventCategory.CHAT:
      return "Chat";
    case EventCategory.COMMAND:
      return "Command";
    case EventCategory.SCRIPT:
      return "Script";
    case EventCategory.MESSAGE:
      return "Message";
    case EventCategory.SYSTEM:
      return "System";
  }
}

function EventIcon({ event }: { event: EventEntry }) {
  const className = "size-4";
  switch (event.type) {
    case EventType.SESSION_STARTED:
    case EventType.SESSION_RESUMED:
    case EventType.SCRIPT_ACTIVATED:
    case EventType.SCRIPT_COMPLETED:
      return <PlayIcon className={className} />;
    case EventType.SESSION_PAUSED:
    case EventType.SCRIPT_PAUSED:
      return <PauseIcon className={className} />;
    case EventType.SESSION_STOPPED:
    case EventType.SCRIPT_CANCELLED:
      return <SquareIcon className={className} />;
    case EventType.BOT_CONNECTING:
    case EventType.BOT_JOINED:
      return <LogInIcon className={className} />;
    case EventType.BOT_DISCONNECTED:
      return <LogOutIcon className={className} />;
    case EventType.CHAT_MESSAGE:
    case EventType.MESSAGE:
      return <MessageSquareIcon className={className} />;
    case EventType.COMMAND_EXECUTED:
      return <SquareTerminalIcon className={className} />;
    case EventType.SCRIPT_ERROR:
      return <Code2Icon className={className} />;
    case EventType.SYSTEM_WARNING:
    case EventType.SYSTEM_ERROR:
      return <CircleAlertIcon className={className} />;
    default:
      return event.category === EventCategory.BOT ? (
        <BotIcon className={className} />
      ) : (
        <ActivityIcon className={className} />
      );
  }
}

function FeedRow(props: { event: EventEntry; instanceId?: string }) {
  const { i18n } = useTranslation("common");
  const { event, instanceId } = props;
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const bodyClassName =
    event.category === EventCategory.CHAT
      ? "rounded-lg border border-border/60 bg-background/70 px-3 py-2 italic"
      : event.severity === EventSeverity.ERROR ||
          event.severity === EventSeverity.WARN
        ? "rounded-lg border border-border/60 bg-background/80 px-3 py-2"
        : undefined;

  return (
    <div
      className={cn(
        "border-border/70 relative overflow-hidden rounded-xl border px-4 py-4 transition-colors",
        severityTone(event),
      )}
    >
      <div className="from-foreground/8 absolute inset-x-0 top-0 h-px bg-linear-to-r via-transparent to-transparent" />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-background/85 shadow-xs ring-1 ring-border/60">
          <EventIcon event={event} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={severityBadgeVariant(event)} className="uppercase">
              {categoryLabel(event)}
            </Badge>
            <Badge variant="outline" className="uppercase">
              {severityLabel(event)}
            </Badge>
            {event.repeatCount > 1 && (
              <Badge variant="secondary">x{event.repeatCount}</Badge>
            )}
            <span className="text-muted-foreground text-xs">
              {formatTime(event, locale)}
            </span>
            {event.userName && (
              <span className="text-muted-foreground text-xs">
                by {event.userName}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[15px] leading-5 font-semibold break-words">
              {event.summary}
            </p>
            {event.body && (
              <div className={bodyClassName}>
                <p className="text-muted-foreground text-sm leading-5 break-words">
                  {event.body}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {event.botAccountName &&
              event.botAccountId &&
              (event.instanceId ?? instanceId) && (
                <Button variant="outline" size="xs" asChild>
                  <Link
                    to="/instance/$instance/bot/$botId"
                    params={{
                      instance: event.instanceId ?? instanceId ?? "",
                      botId: event.botAccountId,
                    }}
                  >
                    {event.botAccountName}
                  </Link>
                </Button>
              )}
            {event.scriptName && (
              <Badge variant="outline">{event.scriptName}</Badge>
            )}
            {event.command && (
              <Badge variant="outline" className="max-w-full truncate">
                /{event.command}
              </Badge>
            )}
            {event.loggerName && (
              <Badge variant="outline">{event.loggerName}</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InstanceEventsPanel(props: {
  scope: EventScope;
  instanceId?: string;
  compact?: boolean;
  title?: string;
  description?: string;
}) {
  const { t } = useTranslation("common");
  const { i18n } = useTranslation("common");
  const transport = use(TransportContext);
  const [gotPrevious, setGotPrevious] = useState(false);
  const [entries, setEntries] = useState<EventEntry[]>(
    isDemo() ? makeDemoEvents() : [],
  );
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [isPaused, setIsPaused] = useState(false);
  const [queuedEntries, setQueuedEntries] = useState<EventEntry[]>([]);
  const [streamState, setStreamState] = useState<StreamState>("connecting");
  const viewportRef = useRef<HTMLDivElement>(null);
  const compact = props.compact ?? false;
  const title = props.title ?? t("pageName.events");
  const description = props.description ?? t("events.description");
  const locale = i18n.resolvedLanguage ?? i18n.language;

  useEffect(() => {
    if (isPaused || queuedEntries.length === 0) {
      return;
    }

    setEntries((previous) =>
      limitEvents(
        mergeConsecutiveEvents([...previous, ...queuedEntries]),
        compact,
      ),
    );
    setQueuedEntries([]);
  }, [compact, isPaused, queuedEntries]);

  useEffect(() => {
    if (!gotPrevious || viewportRef.current === null) {
      return;
    }

    viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
  }, [gotPrevious]);

  useEffect(() => {
    if (gotPrevious || transport === null) {
      return;
    }

    const abortController = new AbortController();
    const eventsService = new EventsServiceClient(transport);
    void eventsService
      .getPrevious(
        {
          scope: props.scope,
          count: FULL_LIMIT,
        },
        { abort: abortController.signal },
      )
      .then((call) => {
        setEntries((previous) =>
          limitEvents(
            mergeConsecutiveEvents([...previous, ...call.response.events]),
            compact,
          ),
        );
        setGotPrevious(true);
      })
      .catch((error) => {
        console.error(error);
        setGotPrevious(true);
      });

    return () => {
      abortController.abort();
    };
  }, [compact, gotPrevious, props.scope, transport]);

  useEffect(() => {
    const abortController = new AbortController();

    function connect(delay = 0) {
      if (transport === null || abortController.signal.aborted) {
        return;
      }

      window.setTimeout(() => {
        if (abortController.signal.aborted || transport === null) {
          return;
        }

        setStreamState((previous) =>
          previous === "connecting" ? "connecting" : "reconnecting",
        );
        const eventsService = new EventsServiceClient(transport);
        const { responses } = eventsService.subscribe(
          { scope: props.scope },
          { abort: abortController.signal },
        );

        responses.onMessage((response) => {
          if (!response.event) {
            return;
          }

          setStreamState("live");
          if (isPaused) {
            setQueuedEntries((previous) => [...previous, response.event!]);
            return;
          }

          setEntries((previous) =>
            limitEvents(
              mergeConsecutiveEvents([...previous, response.event!]),
              compact,
            ),
          );
        });
        responses.onError((error) => {
          if (abortController.signal.aborted) {
            return;
          }

          console.error(error);
          setStreamState("reconnecting");
          connect(3_000);
        });
        responses.onComplete(() => {
          if (abortController.signal.aborted) {
            return;
          }

          setStreamState("reconnecting");
          connect(1_000);
        });
      }, delay);
    }

    connect();

    return () => {
      abortController.abort();
    };
  }, [compact, isPaused, props.scope, transport]);

  const filteredEntries = useMemo(
    () =>
      entries.filter(
        (event) =>
          matchesFilter(event, filter) && matchesQuery(event, deferredQuery),
      ),
    [deferredQuery, entries, filter],
  );
  const timelineItems = useMemo(
    () => (compact ? [] : buildTimelineItems(filteredEntries, locale)),
    [compact, filteredEntries, locale],
  );
  const stats = useMemo(
    () => [
      {
        label: t("events.stats.total"),
        value: entries.length,
      },
      {
        label: t("events.stats.errors"),
        value: countByFilter(entries, "errors"),
      },
      {
        label: t("events.stats.bots"),
        value: countByFilter(entries, "bots"),
      },
      {
        label: t("events.stats.chat"),
        value: countByFilter(entries, "chat"),
      },
    ],
    [entries, t],
  );

  return (
    <Card className="gap-0 overflow-hidden">
      <CardHeader className="border-b bg-linear-to-br from-muted/80 via-background to-background">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <CardAction className="flex items-center gap-2">
          <Badge variant={streamState === "live" ? "secondary" : "outline"}>
            {streamState === "live" ? (
              t("events.status.live")
            ) : (
              <span className="flex items-center gap-1">
                <LoaderCircleIcon className="size-3 animate-spin" />
                {t("events.status.reconnecting")}
              </span>
            )}
          </Badge>
          {!compact && props.instanceId && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/instance/$instance/logs"
                  params={{ instance: props.instanceId }}
                >
                  {t("events.openLogs")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/instance/$instance/terminal"
                  params={{ instance: props.instanceId }}
                >
                  {t("events.openConsole")}
                </Link>
              </Button>
            </>
          )}
        </CardAction>
      </CardHeader>
      {!compact && (
        <CardContent className="border-b py-4">
          <div className="flex flex-col gap-4">
            <div className="grid gap-2 md:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border/70 bg-background/70 px-3 py-3"
                >
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            {(streamState !== "live" || isPaused) && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-3">
                <div className="flex items-center gap-2">
                  {streamState !== "live" ? (
                    <LoaderCircleIcon className="text-muted-foreground size-4 animate-spin" />
                  ) : (
                    <PauseIcon className="text-muted-foreground size-4" />
                  )}
                  <span className="text-sm font-medium">
                    {streamState !== "live"
                      ? t("events.status.reconnecting")
                      : t("events.status.paused")}
                  </span>
                </div>
                {isPaused && queuedEntries.length > 0 && (
                  <Badge variant="outline">
                    {t("events.status.newWhilePaused", {
                      count: queuedEntries.length,
                    })}
                  </Badge>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", t("events.filters.all")],
                  ["errors", t("events.filters.errors")],
                  ["bots", t("events.filters.bots")],
                  ["chat", t("events.filters.chat")],
                  ["commands", t("events.filters.commands")],
                  ["scripts", t("events.filters.scripts")],
                  ["messages", t("events.filters.messages")],
                ] as [FeedFilter, string][]
              ).map(([value, label]) => (
                <Button
                  key={value}
                  variant={filter === value ? "default" : "outline"}
                  size="xs"
                  onClick={() => setFilter(value)}
                >
                  {label}
                </Button>
              ))}
              <Button
                variant={isPaused ? "default" : "outline"}
                size="xs"
                onClick={() => setIsPaused((previous) => !previous)}
              >
                {isPaused
                  ? t("events.status.resume")
                  : t("events.status.pause")}
                {queuedEntries.length > 0 ? ` (${queuedEntries.length})` : ""}
              </Button>
            </div>
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("events.searchPlaceholder")}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      )}
      <ScrollArea
        viewportRef={viewportRef}
        className={cn("pr-4", compact ? "h-[24rem]" : "h-[calc(100dvh-14rem)]")}
      >
        <div className="flex min-h-full flex-col gap-3 p-4">
          {filteredEntries.length === 0 ? (
            <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed px-6 text-center text-sm text-muted-foreground">
              {t("events.empty")}
            </div>
          ) : compact ? (
            filteredEntries.map((event) => (
              <FeedRow
                key={`${event.id}-${event.repeatCount}`}
                event={event}
                instanceId={props.instanceId}
              />
            ))
          ) : (
            timelineItems.map((item) =>
              item.kind === "marker" ? (
                <div
                  key={item.key}
                  className="sticky top-0 z-10 -mx-1 flex items-center gap-3 bg-background/90 px-1 py-1 backdrop-blur-sm"
                >
                  <div className="h-px flex-1 bg-border/70" />
                  <span className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                    {item.label}
                  </span>
                  <div className="h-px flex-1 bg-border/70" />
                </div>
              ) : (
                <FeedRow
                  key={`${item.event.id}-${item.event.repeatCount}`}
                  event={item.event}
                  instanceId={props.instanceId}
                />
              ),
            )
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
