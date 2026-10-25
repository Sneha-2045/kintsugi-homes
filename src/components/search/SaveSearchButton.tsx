import { useState, type FormEvent } from "react";
import { BookmarkPlus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { createSavedSearch } from "@/lib/saved-searches.functions";
import { Modal } from "@/components/common/Modal";

export function SaveSearchButton({
  filters,
  className = "",
}: {
  filters: Record<string, string>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loginNeeded, setLoginNeeded] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setLoginNeeded(false);
    try {
      const result = await createSavedSearch({ name, filters });
      setMessage(
        result.duplicate
          ? `You already have this search saved${result.name ? ` as “${result.name}”` : ""}.`
          : "Search saved. You can manage alerts from Saved Searches.",
      );
      if (!result.duplicate) setName("");
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Could not save this search. Please try again.";
      setLoginNeeded(/unauthorized|bearer|token/i.test(text));
      setMessage(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage(null);
          setOpen(true);
        }}
        className={
          className ||
          "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 font-semibold text-foreground transition hover:border-primary/50 hover:bg-elevated"
        }
      >
        <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
        Save Search
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Save this search">
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <p>Keep these filters together so you can run this search again anytime.</p>
          <label className="block text-sm font-medium text-foreground" htmlFor="saved-search-name">
            Search name
            <input
              autoFocus
              id="saved-search-name"
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Houston under $200k"
              className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground"
            />
          </label>
          {message ? (
            <div
              role={loginNeeded ? "alert" : "status"}
              className="rounded-lg border border-border bg-elevated p-3 text-sm"
            >
              <p>{loginNeeded ? "Please log in to save searches to your account." : message}</p>
              {loginNeeded ? (
                <Link
                  to="/login"
                  className="mt-2 inline-block font-semibold text-primary-light underline"
                >
                  Log in
                </Link>
              ) : null}
            </div>
          ) : null}
          <p className="text-xs">
            Sign in to keep saved searches synced to your account. Configure optional email alerts
            after saving.
          </p>
          <button
            disabled={busy || !name.trim()}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save search"}
          </button>
        </form>
      </Modal>
    </>
  );
}
