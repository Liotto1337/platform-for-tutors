"use client";

import { useState, type FormEvent } from "react";
import { useHydrated } from "@/components/use-hydrated";

export function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const hydrated = useHydrated();

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(data.get("email")).trim().toLowerCase(), password: data.get("password") }),
      });
      if (response.ok) { window.location.assign("/"); return; }
      setError(response.status === 429 ? "Слишком много попыток. Попробуйте позже."
        : response.status >= 500 ? "Вход временно недоступен." : "Проверьте почту и пароль.");
    } catch {
      setError("Не удалось подключиться. Попробуйте ещё раз.");
    }
    setPending(false);
  }

  return <form className="stack" method="post" onSubmit={signIn}>
    <label>Электронная почта<input name="email" type="email" autoComplete="username" required /></label>
    <label>Пароль<input name="password" type="password" autoComplete="current-password" required /></label>
    {error && <p className="error" role="alert">{error}</p>}
    <button disabled={!hydrated || pending}>{pending ? "Входим…" : "Войти"}</button>
  </form>;
}
