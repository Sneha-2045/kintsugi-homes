import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bookmark,
  GitCompareArrows,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type PropertyCardData = {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  location: string;
  city: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  auctionDate: string | null;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string | null;
};
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  properties?: PropertyCardData[] | undefined;
  id: string;
};

const apiRoot = (import.meta.env["VITE_API_BASE_URL"] ?? "").replace(/\/$/, "");
const welcome =
  "Hi! Welcome to Rylestate. I'm your AI Property Assistant.\n\nI can help you discover foreclosure properties, compare listings, understand auctions and explore real estate investment opportunities across the United States.\n\nTell me what you're looking for, and I'll help you find the right properties.";
const suggestions = [
  "Find properties under $300K",
  "Show foreclosure properties in Florida",
  "Find upcoming auctions",
  "Compare properties",
  "Help me evaluate an investment",
  "Explain how foreclosure auctions work",
];

function propertyContextFromPath(path: string) {
  const match = path.match(/^\/(?:property|property-intelligence)\/([^/]+)/);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]!);
  } catch {
    return undefined;
  }
}

function priceLabel(property: PropertyCardData) {
  if (typeof property.price !== "number") return "Price unavailable";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: property.currency || "USD",
      maximumFractionDigits: 0,
    }).format(property.price);
  } catch {
    return "$" + Math.round(property.price).toLocaleString("en-US");
  }
}

export function AIAssistant() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const propertyId = useMemo(() => propertyContextFromPath(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: welcome },
  ]);
  const [notice, setNotice] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const headers = { Accept: "application/json" };
    fetch(apiRoot + "/api/chat/session", { credentials: "include", headers })
      .then(async (response) =>
        response.ok ? (response.json() as Promise<{ sessionId: string | null }>) : null,
      )
      .then(async (session) => {
        if (!session?.sessionId || cancelled) return;
        setSessionId(session.sessionId);
        const response = await fetch(
          apiRoot + "/api/chat/history/" + encodeURIComponent(session.sessionId),
          { credentials: "include" },
        );
        if (!response.ok) return;
        const history = (await response.json()) as {
          messages?: Array<{
            role: "user" | "assistant";
            content: string;
            properties?: PropertyCardData[];
          }>;
        };
        if (!cancelled && history.messages?.length) {
          setMessages(
            history.messages.map((message, index) => ({ ...message, id: "history-" + index })),
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open, busy]);

  const sendMessage = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setNotice("");
    setDraft("");
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: message },
    ]);
    setBusy(true);
    try {
      const response = await fetch(apiRoot + "/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          ...(sessionId ? { sessionId } : {}),
          ...(propertyId ? { propertyId } : {}),
        }),
      });
      const result = (await response.json()) as {
        sessionId?: string;
        message?: { content: string; properties?: PropertyCardData[] };
        error?: string;
      };
      if (!response.ok || !result.message)
        throw new Error(result.error || "The assistant could not respond. Please try again.");
      if (result.sessionId) setSessionId(result.sessionId);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.message!.content,
          properties: result.message!.properties,
        },
      ]);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "The assistant could not respond. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const clearConversation = async () => {
    if (busy) return;
    try {
      if (sessionId)
        await fetch(apiRoot + "/api/chat/history/" + encodeURIComponent(sessionId), {
          method: "DELETE",
          credentials: "include",
        });
      setSessionId(undefined);
      setMessages([{ id: "welcome", role: "assistant", content: welcome }]);
      setNotice("");
    } catch {
      setNotice("Could not clear this conversation. Please try again.");
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  return (
    <>
      {open ? (
        <section
          aria-label="Rylestate AI Property Assistant"
          className="fixed bottom-5 right-4 z-[60] flex h-[min(720px,calc(100dvh-6rem))] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:right-6"
        >
          <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary-light">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-foreground">Rylestate AI</h2>
              <p className="text-xs text-muted-foreground">
                Property discovery and foreclosure research
              </p>
            </div>
            <button
              type="button"
              onClick={() => void clearConversation()}
              disabled={busy}
              aria-label="Clear conversation"
              title="Clear conversation"
              className="rounded-lg p-2 text-muted-foreground hover:bg-elevated hover:text-foreground disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-2 text-muted-foreground hover:bg-elevated hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div
            ref={bodyRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
            aria-live="polite"
          >
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "ml-8" : "mr-2"}>
                <div
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[95%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground"
                      : "max-w-[98%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-elevated px-4 py-3 text-sm leading-relaxed text-foreground"
                  }
                >
                  {message.content}
                </div>
                {message.properties?.length ? (
                  <div className="mt-3 space-y-3">
                    {message.role === "assistant" &&
                    message.properties.length > 1 &&
                    /compar/i.test(message.content) ? (
                      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                        <table className="w-full min-w-[420px] text-left text-xs">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground">
                              <th className="p-2">Detail</th>
                              {message.properties.slice(0, 5).map((property) => (
                                <th key={property.id} className="p-2">
                                  {property.city || "Listing"}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              ["Price", (property: PropertyCardData) => priceLabel(property)],
                              [
                                "Location",
                                (property: PropertyCardData) => property.location || "Unavailable",
                              ],
                              [
                                "Bedrooms",
                                (property: PropertyCardData) => property.bedrooms ?? "Unavailable",
                              ],
                              [
                                "Bathrooms",
                                (property: PropertyCardData) => property.bathrooms ?? "Unavailable",
                              ],
                              [
                                "Area",
                                (property: PropertyCardData) =>
                                  property.areaSqft != null
                                    ? property.areaSqft.toLocaleString() + " sqft"
                                    : "Unavailable",
                              ],
                              [
                                "Auction",
                                (property: PropertyCardData) =>
                                  property.auctionDate || "Unavailable",
                              ],
                              [
                                "Price / sqft",
                                (property: PropertyCardData) =>
                                  property.price != null && property.areaSqft
                                    ? "$" + (property.price / property.areaSqft).toFixed(2)
                                    : "Unavailable",
                              ],
                            ].map(([label, getValue]) => (
                              <tr
                                key={String(label)}
                                className="border-b border-border last:border-0"
                              >
                                <th className="p-2 font-medium text-muted-foreground">
                                  {String(label)}
                                </th>
                                {message.properties!.slice(0, 5).map((property) => (
                                  <td key={property.id} className="p-2 text-foreground">
                                    {String(
                                      (getValue as (value: PropertyCardData) => unknown)(property),
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                    {message.properties.slice(0, 8).map((property) => (
                      <article
                        key={property.id}
                        className="overflow-hidden rounded-xl border border-border bg-surface"
                      >
                        <div className="relative aspect-[16/9] bg-elevated">
                          {property.images?.[0] ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-sm text-muted-foreground">
                              Property image unavailable
                            </div>
                          )}
                          {property.auctionDate ? (
                            <span className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground">
                              Auction {property.auctionDate}
                            </span>
                          ) : null}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-foreground">{priceLabel(property)}</p>
                          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
                            {property.title}
                          </h3>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {property.location || "US location unavailable"}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {[
                              property.bedrooms != null ? property.bedrooms + " beds" : null,
                              property.bathrooms != null ? property.bathrooms + " baths" : null,
                              property.areaSqft != null
                                ? property.areaSqft.toLocaleString() + " sqft"
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Details unavailable"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <a
                              href={"/property/" + encodeURIComponent(property.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
                            >
                              View property <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                            {property.latitude != null && property.longitude != null ? (
                              <a
                                href={
                                  "https://maps.google.com/?q=" +
                                  property.latitude +
                                  "," +
                                  property.longitude
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-elevated"
                              >
                                Map
                              </a>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => {
                                void fetch(apiRoot + "/api/properties/save", {
                                  method: "POST",
                                  credentials: "include",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ propertyId: property.id }),
                                })
                                  .then(async (response) => {
                                    const body = (await response.json().catch(() => ({}))) as {
                                      error?: string;
                                    };
                                    setNotice(
                                      response.ok
                                        ? "Property saved to your account."
                                        : body.error ||
                                            (response.status === 401
                                              ? "Sign in to your Rylestate MongoDB account to save properties."
                                              : "Could not save this property."),
                                    );
                                  })
                                  .catch(() => setNotice("Could not save this property."));
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-elevated"
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = compareIds.includes(property.id)
                                  ? compareIds
                                  : [...compareIds, property.id].slice(-5);
                                setCompareIds(next);
                                if (next.length < 2) {
                                  setNotice("Choose one more listing to compare.");
                                  return;
                                }
                                setCompareIds([]);
                                void sendMessage(
                                  "Compare these property listings using their current records: " +
                                    next.join(", "),
                                );
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-elevated"
                            >
                              <GitCompareArrows className="h-3.5 w-3.5" />
                              Compare {compareIds.includes(property.id) ? "selected" : ""}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {busy ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Searching the current Rylestate inventory…
              </div>
            ) : null}
            {notice ? (
              <p role="status" className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
                {notice}
              </p>
            ) : null}
            {!sessionId && messages.length === 1 && !busy ? (
              <div className="pt-1">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Try asking</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void sendMessage(suggestion)}
                      className="rounded-full border border-border bg-surface px-3 py-2 text-xs text-foreground transition-colors hover:border-primary/50 hover:bg-elevated"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={submit} className="border-t border-border bg-surface p-3">
            {propertyId ? (
              <p className="mb-2 truncate text-xs text-primary-light">
                Asking about listing {propertyId}
              </p>
            ) : null}
            <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:ring-2 focus-within:ring-primary/50">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(draft);
                  }
                }}
                rows={1}
                maxLength={4000}
                placeholder="Ask about a property or foreclosure…"
                className="max-h-28 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Message the property assistant"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
              Listing details can change. Verify current status and sale terms with the listing
              source. AI responses are informational.
            </p>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close Rylestate AI" : "Open Rylestate AI Property Assistant"}
        className="fixed bottom-6 right-24 z-[60] grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated transition hover:scale-105 hover:bg-primary-hover"
        title="Ask Rylestate AI"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            <span className="sr-only">Rylestate AI Property Assistant</span>
          </>
        )}
      </button>
    </>
  );
}
