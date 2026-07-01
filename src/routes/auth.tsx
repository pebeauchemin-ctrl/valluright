import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { commercialPlanBySlug } from "@/lib/commercial-model";
import { useServerFn } from "@tanstack/react-start";
import { recordPublicClientEvent } from "@/lib/observability.functions";

type Mode = "signin" | "signup" | "forgot";
type AuthSearch = { mode?: Mode; plan?: string };

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — ValuRight.ai" }] }),
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    mode: search.mode === "signup" || search.mode === "forgot" ? search.mode : undefined,
    plan: typeof search.plan === "string" ? search.plan : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const selectedPlan = commercialPlanBySlug(search.plan);
  const recordEvent = useServerFn(recordPublicClientEvent);
  const [mode, setMode] = useState<Mode>(search.mode ?? (selectedPlan ? "signup" : "signin"));
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/app" });
  }, [user, navigate]);

  useEffect(() => {
    if (search.mode === "signup" || (selectedPlan && mode === "signin")) setMode("signup");
  }, [search.mode, selectedPlan, mode]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== "undefined" ? window.location.origin + "/reset-password" : undefined,
      });
      setBusy(false);
      if (error) setError(error.message);
      else
        setInfo(
          "If an account exists for that email, a reset link is on its way. Check your inbox.",
        );
      return;
    }

    const { error } =
      mode === "signin" ? await signIn(email, password) : await signUp(email, password, fullName);
    setBusy(false);
    if (error) {
      setError(error);
    } else {
      if (mode === "signup") {
        recordEvent({
          data: {
            eventName: "signup_completed",
            severity: "info",
            area: "auth",
            metadata: { method: "email", selected_plan: selectedPlan?.slug ?? null },
          },
        }).catch(() => undefined);
      }
      navigate({ to: "/app" });
    }
  };

  const heading =
    mode === "signin"
      ? "Welcome back"
      : mode === "signup"
        ? "Create your account"
        : "Reset your password";
  const subheading =
    mode === "signin"
      ? "Sign in to your dashboard."
      : mode === "signup"
        ? selectedPlan
          ? `Create your account to start the ${selectedPlan.name} flow. Billing is not charged yet.`
          : "Start your first valuation in minutes."
        : "Enter your email and we'll send you a link to choose a new password.";
  const cta =
    mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link";

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground p-12 flex-col justify-between">
        <Link to="/" className="flex items-center">
          <BrandLogo size={36} variant="onDark" withTagline />
        </Link>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Estimate your
            <br />
            planning range.
          </h2>
          <p className="mt-4 text-primary-foreground/70 max-w-md">
            Join owners using ValuRight.ai to plan a confident exit on their terms.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">
          © ValuRight.ai · Software-generated estimates only.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center mb-8">
            <BrandLogo size={32} />
          </Link>

          <h1 className="font-display text-3xl font-semibold text-primary">{heading}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subheading}</p>
          {selectedPlan && mode === "signup" && (
            <div className="mt-4 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
              <div className="font-semibold text-primary">{selectedPlan.name}</div>
              <div className="mt-1 text-muted-foreground">
                {selectedPlan.price}
                <span className="text-xs"> {selectedPlan.sub}</span> · {selectedPlan.who}
              </div>
            </div>
          )}

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <Field
                label="Full name"
                type="text"
                value={fullName}
                onChange={setFullName}
                required
              />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} required />
            {mode !== "forgot" && (
              <div>
                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  required
                  minLength={6}
                />
                {mode === "signin" && (
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-foreground">
                {info}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-60"
            >
              {busy ? "Please wait…" : cta}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "forgot" ? (
              <button
                onClick={() => switchMode("signin")}
                className="font-semibold text-accent hover:underline"
              >
                Back to sign in
              </button>
            ) : (
              <>
                {mode === "signin" ? "New to ValuRight?" : "Already have an account?"}{" "}
                <button
                  onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                  className="font-semibold text-accent hover:underline"
                >
                  {mode === "signin" ? "Create one" : "Sign in"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
      />
    </label>
  );
}
