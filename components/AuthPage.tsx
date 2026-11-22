"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";

type AuthPageProps = {
  mode: "login" | "signup";
};

export default function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = {
      first_name: String(form.get("first_name") || ""),
      last_name: String(form.get("last_name") || ""),
      username: String(form.get("username") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    };

    try {
      const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({ error: "Authentication failed" }));
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        return;
      }
      router.push("/quest");
      router.refresh();
    } catch {
      setError("Could not reach the authentication service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="strip" aria-hidden="true">
        <span style={{ background: "var(--green)" }} />
        <span style={{ background: "var(--red)" }} />
        <span style={{ background: "var(--orange)" }} />
        <span style={{ background: "var(--blue)" }} />
      </div>
      <main className="auth-page">
        <header className="auth-header">
          <Link className="landing-brand" href="/" aria-label="T-Quest home">
            <span className="tbadge">T</span>
            <span className="display">T-Quest</span>
          </Link>
          <Link className="auth-home-link" href="/">Back to home</Link>
        </header>

        <section className="auth-card" aria-labelledby="auth-title">
          <div className="landing-eyebrow">
            <span className="eyebrow-dot" />
            YOUR NEXT NIGHT STARTS HERE
          </div>
          <h1 id="auth-title" className="display">{isLogin ? "Welcome back." : "Join the quest."}</h1>
          <p className="auth-intro">
            {isLogin
              ? "Sign in and get your crew's next night out moving."
              : "Create an account and start planning your next Boston night."}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <label htmlFor="first_name">First name</label>
                <input id="first_name" name="first_name" autoComplete="given-name" required />
                <label htmlFor="last_name">Last name</label>
                <input id="last_name" name="last_name" autoComplete="family-name" required />
                <label htmlFor="username">Username</label>
                <input id="username" name="username" autoComplete="username" required />
              </>
            )}
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={8}
              required
            />
            <button className="go auth-submit" type="submit" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign in" : "Sign up"} <span aria-hidden="true">→</span>
            </button>
          </form>
          {error && <p className="auth-error" role="alert">{error}</p>}

          <p className="auth-switch">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link href={isLogin ? "/signup" : "/login"}>
              {isLogin ? "Register here" : "Sign in here"}
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
