"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RefreshJobs({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 5000);
    return () => clearInterval(timer);
  }, [active, router]);
  return null;
}
