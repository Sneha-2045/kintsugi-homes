import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Yadori Estate" },
      { name: "description", content: "Sign in to your Yadori Estate account to manage property listings." },
      { property: "og:title", content: "Log in — Yadori Estate" },
      {
        property: "og:description",
        content: "Sign in to your Yadori Estate account to manage property listings.",
      },
    ],
  }),
  component: LoginPage,
});

const inputClass =
  "h-12 w-full rounded-lg border border-border bg-elevated px-4 text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      setMessage(error ? error.message : "Check your email to confirm your account.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    void navigate({ to: "/admin" });
  };

  return (
    <div className="grid min-h-[70vh] place-items-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-bold text-foreground">
          {mode === "signin" ? "Log in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to manage your property listings.
        </p>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {mode === "signin" ? "Log in" : "Sign up"}
          </Button>
        </form>

        {message ? (
          <p role="status" className="mt-4 text-sm text-warning">
            {message}
          </p>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "No account?" : "Already registered?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setMessage(null);
            }}
            className="text-primary-light underline underline-offset-4"
          >
            {mode === "signin" ? "Create one" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
