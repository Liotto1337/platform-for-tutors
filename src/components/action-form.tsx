"use client";

import { startTransition, useActionState } from "react";
import type { ActionState } from "@/modules/actions/state";
import { useHydrated } from "./use-hydrated";

export function ActionForm({ action, children, label, className = "stack", secondary = false }: {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  children?: React.ReactNode; label: string; className?: string; secondary?: boolean;
}) {
  const [state, submit, pending] = useActionState(action, { error: "" });
  const hydrated = useHydrated();
  return <form className={className} method="post" onSubmit={(event) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    startTransition(() => submit(data));
  }}>
    {children}
    {state.error && <p className="error" role="alert">{state.error}</p>}
    <button className={secondary ? "secondary" : undefined} disabled={!hydrated || pending}>{pending ? "Подождите…" : label}</button>
  </form>;
}
