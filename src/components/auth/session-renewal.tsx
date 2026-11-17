"use client";

import { useEffect } from "react";
import { unstable_rethrow } from "next/navigation";
import { refreshSession } from "@/actions/auth.actions";

export function SessionRenewal() {
  useEffect(() => {
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState !== "visible") return;
      pending = true;
      try {
        await refreshSession();
      } catch (error) {
        unstable_rethrow(error);
        // A temporary network failure should not sign the user out.
        // Retry on the next focus or interval; server routes still verify auth.
      } finally {
        pending = false;
      }
    };
    void refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const interval = window.setInterval(refresh, 60 * 60 * 1000);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(interval);
    };
  }, []);
  return null;
}
