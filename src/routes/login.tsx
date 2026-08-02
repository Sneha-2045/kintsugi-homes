import { createFileRoute, Link } from "@tanstack/react-router";
import { Apple } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/common/Button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Yadori Estate" },
      { name: "description", content: "Sign in to your Yadori Estate account to see saved property." },
      { property: "og:title", content: "Log in — Yadori Estate" },
      {
        property: "og:description",
        content: "Sign in to your Yadori Estate account to see saved property.",
      },
    ],
  }),
  component: LoginPage,
});

const inputClass =
  "h-12 w-full rounded-lg border border-border bg-elevated px-4 text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary";

function LoginPage() {
  const [note, setNote] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setNote(true);
  };

  return (
    <div className="grid min-h-[70vh] place-items-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-bold text-foreground">Log in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Demo interface only — no accounts exist and nothing is stored.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setNote(true)}>
            <span aria-hidden="true" className="font-bold text-primary-light">
              G
            </span>
            Google
          </Button>
          <Button variant="outline" onClick={() => setNote(true)}>
            <Apple className="h-4 w-4" />
            Apple
          </Button>
        </div>

        <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-widest text-subtle">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-foreground">
              Email
            </label>
            <input id="login-email" type="email" required className={inputClass} placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-foreground">
              Password
            </label>
            <input id="login-password" type="password" required className={inputClass} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" size="lg">
            Continue
          </Button>
        </form>

        {note ? (
          <p role="status" className="mt-4 text-sm text-warning">
            Authentication is not implemented in this front-end demo.
          </p>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link to="/pricing" className="text-primary-light underline underline-offset-4">
            Start a free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
