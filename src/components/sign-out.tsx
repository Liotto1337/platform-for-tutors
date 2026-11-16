"use client";

import { useState } from "react";

export function SignOut() {
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  async function signOut() {
    setStatus("pending");
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      if (response.ok) { window.location.assign("/login"); return; }
    } catch {}
    setStatus("error");
  }
  return <div><button className="quiet" type="button" onClick={signOut} disabled={status === "pending"}>
    {status === "pending" ? "Выходим…" : "Выйти"}
  </button>{status === "error" && <p className="error" role="alert">Выход не удался.</p>}</div>;
}
